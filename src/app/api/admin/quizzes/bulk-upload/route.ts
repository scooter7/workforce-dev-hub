// src/app/api/admin/quizzes/bulk-upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import Papa from 'papaparse';
import { workforceTopics, Topic, SubTopic } from '@/lib/constants'; // For mapping topic names to IDs
import { QuizQuestion, QuestionOption, MediaPosition } from '@/types/quiz'; // For typing

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

// Define expected CSV headers for validation
const EXPECTED_HEADERS = [
    'Main Topic Title', 'Subtopic Title', 'Question Text', 'Question Type', 
    'Points', 'Explanation', 'Video Embed Code', 'Image URL', 'Media Position',
    'Option 1 Text', 'Option 1 IsCorrect', 
    'Option 2 Text', 'Option 2 IsCorrect',
    'Option 3 Text', 'Option 3 IsCorrect',
    'Option 4 Text', 'Option 4 IsCorrect' // Added a 4th option
];

interface CsvRow {
    'Main Topic Title': string;
    'Subtopic Title'?: string;
    'Question Text': string;
    'Question Type': string; // 'multiple-choice' or 'true-false'
    'Points': string; // Will be parsed to number
    'Explanation'?: string;
    'Video Embed Code'?: string;
    'Image URL'?: string;
    'Media Position'?: string; // 'above_text', 'below_text', 'left_of_text', 'right_of_text'
    'Option 1 Text'?: string;
    'Option 1 IsCorrect'?: string; // 'TRUE' or 'FALSE'
    'Option 2 Text'?: string;
    'Option 2 IsCorrect'?: string;
    'Option 3 Text'?: string;
    'Option 3 IsCorrect'?: string;
    'Option 4 Text'?: string; // Added
    'Option 4 IsCorrect'?: string; // Added
}

// Helper to find topic/subtopic IDs
const getTopicInfo = (mainTopicTitle: string, subtopicTitle?: string): { topic: Topic | null, subtopic: SubTopic | null } => {
    const mainTopic = workforceTopics.find(t => t.title.trim().toLowerCase() === mainTopicTitle.trim().toLowerCase());
    if (!mainTopic) return { topic: null, subtopic: null };

    let subtopicObj: SubTopic | null = null;
    if (subtopicTitle && subtopicTitle.trim() !== '') {
        const foundSubTopic = mainTopic.subtopics.find(st => st.title.trim().toLowerCase() === subtopicTitle.trim().toLowerCase());
        subtopicObj = foundSubTopic || null;
    }
    return { topic: mainTopic, subtopic: subtopicObj };
};

export async function POST(req: NextRequest) {
    const supabaseAuth = createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!ADMIN_USER_ID || user.id !== ADMIN_USER_ID) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const supabaseAdmin = createSupabaseAdminClient();
    const processingErrors: Array<{ row: number; error: string; details?: any }> = [];
    let successfulRows = 0;
    let quizzesCreatedCount = 0;
    let questionsCreatedCount = 0;

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            return NextResponse.json({ error: 'Invalid file type. Please upload a CSV.' }, { status: 400 });
        }

        const fileContent = await file.text();

        const parseResult = Papa.parse<CsvRow>(fileContent, {
            header: true,
            skipEmptyLines: 'greedy', // Skips lines that are empty or only whitespace
            transformHeader: header => header.trim(),
        });
        
        if (parseResult.errors.length > 0) {
            const criticalErrors = parseResult.errors.filter(e => e.code !== 'TooFewFields' && e.code !== 'TooManyFields'); // Ignore non-critical parsing errors for now
            if (criticalErrors.length > 0) {
                 console.error("CSV Parsing critical errors:", criticalErrors);
                 return NextResponse.json({ message: 'Error parsing CSV file.', errors: criticalErrors.map(e => ({row: e.row, error: e.message})) }, { status: 400 });
            }
        }
        
        const receivedHeaders = parseResult.meta.fields;
        if (!receivedHeaders || !EXPECTED_HEADERS.every(h => receivedHeaders.map(rh => rh.toLowerCase()).includes(h.toLowerCase()))) {
            return NextResponse.json({ 
                message: 'CSV headers do not match expected format or some are missing.',
                expected: EXPECTED_HEADERS,
                received: receivedHeaders
            }, { status: 400 });
        }

        const rows = parseResult.data.filter(row => Object.values(row).some(val => val !== null && val !== undefined && String(val).trim() !== ''));
        if (rows.length === 0) return NextResponse.json({ message: 'CSV file is empty or contains no processable data rows.' }, { status: 400 });

        const quizIdCache: Record<string, string> = {}; 
        const questionOrderNumMap: Record<string, number> = {};

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowIndexForUser = i + 2; 

            try {
                const mainTopicTitle = row['Main Topic Title']?.trim();
                const subtopicTitle = row['Subtopic Title']?.trim();
                const questionText = row['Question Text']?.trim();
                const questionType = row['Question Type']?.trim().toLowerCase();

                if (!questionText || !questionType || !mainTopicTitle) {
                    processingErrors.push({ row: rowIndexForUser, error: 'Missing required fields (Question Text, Question Type, or Main Topic Title).' });
                    continue;
                }

                const { topic: topicInfo, subtopic: subtopicInfo } = getTopicInfo(mainTopicTitle, subtopicTitle);
                if (!topicInfo) {
                    processingErrors.push({ row: rowIndexForUser, error: `Main Topic "${mainTopicTitle}" not found.` });
                    continue;
                }
                if (subtopicTitle && !subtopicInfo) {
                    processingErrors.push({ row: rowIndexForUser, error: `Subtopic "${subtopicTitle}" not found under Main Topic "${mainTopicTitle}".` });
                    continue;
                }

                const topicId = topicInfo.id;
                const subtopicId = subtopicInfo ? subtopicInfo.id : null;
                const cacheKey = `${topicId}-${subtopicId || 'none'}`;
                let quizIdToUse = quizIdCache[cacheKey];

                if (!quizIdToUse) {
                    const quizTitle = subtopicInfo ? 
                        `${subtopicInfo.title} Quiz (${topicInfo.title})` : 
                        `${topicInfo.title} Quiz`;
                    
                    let { data: existingQuiz } = await supabaseAdmin
                        .from('quizzes')
                        .select('id')
                        .eq('topic_id', topicId)
                        .$if(subtopicId, qb => qb.eq('subtopic_id', subtopicId))
                        .$if(!subtopicId, qb => qb.is('subtopic_id', null))
                        .eq('title', quizTitle) // Try to match by title too for re-use
                        .maybeSingle();

                    if (existingQuiz) {
                        quizIdToUse = existingQuiz.id;
                    } else {
                        const { data: newQuiz, error: createQuizError } = await supabaseAdmin
                            .from('quizzes')
                            .insert({ title: quizTitle, topic_id: topicId, subtopic_id: subtopicId, difficulty: 'medium' })
                            .select('id').single();
                        if (createQuizError || !newQuiz) throw new Error(`Failed to create quiz "${quizTitle}": ${createQuizError?.message}`);
                        quizIdToUse = newQuiz.id;
                        quizzesCreatedCount++;
                    }
                    quizIdCache[cacheKey] = quizIdToUse;
                    questionOrderNumMap[quizIdToUse] = 0;
                }
                
                questionOrderNumMap[quizIdToUse] = (questionOrderNumMap[quizIdToUse] || 0) + 1;

                let imageUrl = row['Image URL']?.trim() || null;
                let videoUrl = row['Video Embed Code']?.trim() || null;
                let mediaPosition = row['Media Position']?.trim() as MediaPosition || null;

                if (imageUrl && videoUrl) videoUrl = null; 
                if (!imageUrl && !videoUrl) mediaPosition = null;

                const questionData = {
                    quiz_id: quizIdToUse,
                    question_text: questionText,
                    question_type: questionType as 'multiple-choice' | 'true-false',
                    points: parseInt(row['Points'], 10) || 2,
                    explanation: row['Explanation']?.trim() || null,
                    image_url: imageUrl,
                    video_url: videoUrl,
                    media_position: mediaPosition || (imageUrl || videoUrl ? 'above_text' : null),
                    order_num: questionOrderNumMap[quizIdToUse],
                };
                
                if (questionData.question_type !== 'multiple-choice' && questionData.question_type !== 'true-false') {
                    processingErrors.push({ row: rowIndexForUser, error: `Invalid Question Type: "${row['Question Type']}".` });
                    continue;
                }

                const { data: insertedQuestion, error: qInsertError } = await supabaseAdmin
                    .from('quiz_questions').insert(questionData).select('id').single();
                if (qInsertError || !insertedQuestion) throw new Error(`Ins Q err: ${qInsertError?.message}`);
                questionsCreatedCount++;

                const questionOptions: Omit<QuestionOption, 'id' | 'question_id'>[] = [];
                for (let optIdx = 1; optIdx <= 4; optIdx++) { // Up to 4 options
                    const optText = row[`Option ${optIdx} Text` as keyof CsvRow]?.trim();
                    const optIsCorrectStr = row[`Option ${optIdx} IsCorrect` as keyof CsvRow]?.trim().toUpperCase();
                    if (optText) {
                        questionOptions.push({ option_text: optText, is_correct: optIsCorrectStr === 'TRUE' });
                    }
                }

                if ((questionData.question_type === 'multiple-choice' || questionData.question_type === 'true-false') && questionOptions.length < 2) {
                     processingErrors.push({ row: rowIndexForUser, error: `Type '${questionData.question_type}' needs >= 2 options.` });
                     continue;
                }
                if (questionOptions.length > 0 && !questionOptions.some(opt => opt.is_correct)) {
                    processingErrors.push({ row: rowIndexForUser, error: `No correct option marked.` });
                    continue;
                }

                if (questionOptions.length > 0) {
                    const optionsToInsertDb = questionOptions.map(opt => ({ question_id: insertedQuestion.id, ...opt }));
                    const { error: optsInsertError } = await supabaseAdmin.from('question_options').insert(optionsToInsertDb);
                    if (optsInsertError) throw new Error(`Ins Opt err: ${optsInsertError.message}`);
                }
                successfulRows++;
            } catch (err: any) {
                processingErrors.push({ row: rowIndexForUser, error: err.message || 'Unknown error processing row.' });
            }
        }

        let finalMessage = `Bulk upload processing complete. ${successfulRows} questions (across ${quizzesCreatedCount} new quizzes and existing ones) processed successfully.`;
        if (processingErrors.length > 0) {
            finalMessage += ` ${processingErrors.length} rows had errors.`;
        }

        return NextResponse.json({ 
            message: finalMessage, successfulRows, failedRows: processingErrors.length, errors: processingErrors 
        }, { status: processingErrors.length > 0 ? 207 : 200 });

    } catch (error: any) {
        console.error('Bulk upload API error (outer catch):', error);
        return NextResponse.json({ message: 'Failed to process CSV file.', error: error.message, errors: processingErrors }, { status: 500 });
    }
}

