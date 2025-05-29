import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import Papa from 'papaparse';
import { workforceTopics, Topic, SubTopic } from '@/lib/constants';
import { QuizQuestion, QuestionOption, MediaPosition } from '@/types/quiz'; // These types are used below

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

const EXPECTED_HEADERS = [
    'Main Topic Title', 'Subtopic Title', 'Question Text', 'Question Type', 
    'Points', 'Explanation', 'Video Embed Code', 'Image URL', 'Media Position',
    'Option 1 Text', 'Option 1 IsCorrect', 
    'Option 2 Text', 'Option 2 IsCorrect',
    'Option 3 Text', 'Option 3 IsCorrect',
    'Option 4 Text', 'Option 4 IsCorrect'
];

interface CsvRow {
    'Main Topic Title': string;
    'Subtopic Title'?: string;
    'Question Text': string;
    'Question Type': string;
    'Points': string;
    'Explanation'?: string;
    'Video Embed Code'?: string;
    'Image URL'?: string;
    'Media Position'?: string;
    'Option 1 Text'?: string;
    'Option 1 IsCorrect'?: string;
    'Option 2 Text'?: string;
    'Option 2 IsCorrect'?: string;
    'Option 3 Text'?: string;
    'Option 3 IsCorrect'?: string;
    'Option 4 Text'?: string;
    'Option 4 IsCorrect'?: string;
}

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

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            return NextResponse.json({ error: 'Invalid file type. Please upload a CSV.' }, { status: 400 });
        }
        const fileContent = await file.text();
        const parseResult = Papa.parse<CsvRow>(fileContent, {
            header: true, skipEmptyLines: 'greedy', transformHeader: header => header.trim(),
        });
        
        if (parseResult.errors.length > 0) {
            const criticalErrors = parseResult.errors.filter(e => e.code !== 'TooFewFields' && e.code !== 'TooManyFields');
            if (criticalErrors.length > 0) {
                 return NextResponse.json({ message: 'Error parsing CSV file.', errors: criticalErrors.map(e => ({row: e.row + 2, error: e.message})) }, { status: 400 });
            }
        }
        
        const receivedHeaders = parseResult.meta.fields;
        if (!receivedHeaders || !EXPECTED_HEADERS.every(h => receivedHeaders.map(rh => rh.toLowerCase()).includes(h.toLowerCase()))) {
            return NextResponse.json({ message: 'CSV headers do not match expected format.', expected: EXPECTED_HEADERS, received: receivedHeaders }, { status: 400 });
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
                const questionTypeStr = row['Question Type']?.trim().toLowerCase();

                if (!questionText || !questionTypeStr || !mainTopicTitle) {
                    processingErrors.push({ row: rowIndexForUser, error: 'Missing required fields (Question Text, Question Type, or Main Topic Title).' }); continue;
                }

                const { topic: topicInfo, subtopic: subtopicInfo } = getTopicInfo(mainTopicTitle, subtopicTitle);
                if (!topicInfo) { processingErrors.push({ row: rowIndexForUser, error: `Main Topic "${mainTopicTitle}" not found.` }); continue; }
                if (subtopicTitle && !subtopicInfo) { processingErrors.push({ row: rowIndexForUser, error: `Subtopic "${subtopicTitle}" not found under "${mainTopicTitle}".` }); continue; }

                const topicId = topicInfo.id;
                const subtopicId = subtopicInfo ? subtopicInfo.id : null;
                const cacheKey = `${topicId}-${subtopicId || 'none'}`;
                let quizIdToUse = quizIdCache[cacheKey];

                if (!quizIdToUse) {
                    const quizTitle = subtopicInfo ? `${subtopicInfo.title} Quiz (${topicInfo.title})` : `${topicInfo.title} Quiz`;
                    let query = supabaseAdmin.from('quizzes').select('id').eq('topic_id', topicId).eq('title', quizTitle);
                    if (subtopicId) { query = query.eq('subtopic_id', subtopicId); } 
                    else { query = query.is('subtopic_id', null); }
                    const { data: existingQuiz, error: findError } = await query.maybeSingle();

                    if (findError && findError.code !== 'PGRST116') throw new Error(`Error finding quiz: ${findError.message}`);
                    if (existingQuiz) { quizIdToUse = existingQuiz.id; } 
                    else {
                        const { data: newQuiz, error: createQuizError } = await supabaseAdmin.from('quizzes')
                            .insert({ title: quizTitle, topic_id: topicId, subtopic_id: subtopicId, difficulty: 'medium' })
                            .select('id').single();
                        if (createQuizError || !newQuiz) throw new Error(`Failed to create quiz "${quizTitle}": ${createQuizError?.message}`);
                        quizIdToUse = newQuiz.id; quizzesCreatedCount++;
                    }
                    quizIdCache[cacheKey] = quizIdToUse; questionOrderNumMap[quizIdToUse] = 0;
                }
                questionOrderNumMap[quizIdToUse] = (questionOrderNumMap[quizIdToUse] || 0) + 1;

                let imageUrl = row['Image URL']?.trim() || null;
                let videoUrl = row['Video Embed Code']?.trim() || null;
                let mediaPositionFromCsv = row['Media Position']?.trim() as MediaPosition | undefined || null; // MediaPosition type is used here
                if (imageUrl && videoUrl) videoUrl = null; 
                if (!imageUrl && !videoUrl) mediaPositionFromCsv = null;

                const questionDataForDb: Omit<QuizQuestion, 'id' | 'options' | 'quiz_id'> & { quiz_id: string } = { // Explicit type for insert
                    quiz_id: quizIdToUse, question_text: questionText,
                    question_type: questionTypeStr as 'multiple-choice' | 'true-false',
                    points: parseInt(row['Points'], 10) || 2, explanation: row['Explanation']?.trim() || null,
                    image_url: imageUrl, video_url: videoUrl,
                    media_position: mediaPositionFromCsv || (imageUrl || videoUrl ? 'above_text' : null),
                    order_num: questionOrderNumMap[quizIdToUse],
                };
                if (questionDataForDb.question_type !== 'multiple-choice' && questionDataForDb.question_type !== 'true-false') {
                    processingErrors.push({ row: rowIndexForUser, error: `Invalid Question Type: "${row['Question Type']}".` }); continue;
                }

                const { data: insertedQuestion, error: qInsertError } = await supabaseAdmin
                    .from('quiz_questions').insert(questionDataForDb)
                    .select('id, quiz_id, question_text, question_type, explanation, points, order_num, image_url, video_url, media_position')
                    .single();
                if (qInsertError || !insertedQuestion) throw new Error(`Failed to insert question (row ${rowIndexForUser}): ${qInsertError?.message || 'No data returned'}`);
                
                const questionOptionsFromCsv: Omit<QuestionOption, 'id' | 'question_id'>[] = []; // QuestionOption type used here
                for (let optIdx = 1; optIdx <= 4; optIdx++) {
                    const optText = row[`Option ${optIdx} Text` as keyof CsvRow]?.trim();
                    const optIsCorrectStr = row[`Option ${optIdx} IsCorrect` as keyof CsvRow]?.trim().toUpperCase();
                    if (optText) questionOptionsFromCsv.push({ option_text: optText, is_correct: optIsCorrectStr === 'TRUE' });
                }

                if ((questionDataForDb.question_type === 'multiple-choice' || questionDataForDb.question_type === 'true-false') && questionOptionsFromCsv.length < 2) {
                     processingErrors.push({ row: rowIndexForUser, error: `Type '${questionDataForDb.question_type}' needs >= 2 options.` }); continue;
                }
                if (questionOptionsFromCsv.length > 0 && !questionOptionsFromCsv.some(opt => opt.is_correct)) {
                    processingErrors.push({ row: rowIndexForUser, error: `No correct option marked.` }); continue;
                }

                // let insertedOptionsData: QuestionOption[] = []; // Not directly needed if not constructing fullQuestionForCallback
                if (questionOptionsFromCsv.length > 0) {
                    const optionsToInsertDb = questionOptionsFromCsv.map(opt => ({ question_id: insertedQuestion.id, ...opt }));
                    const { error: optsInsertError } = await supabaseAdmin.from('question_options').insert(optionsToInsertDb);
                    if (optsInsertError) throw new Error(`Failed to insert options for question ${insertedQuestion.id} (row ${rowIndexForUser}): ${optsInsertError.message}`);
                }
                
                // The _processedFullQuestion variable was removed as it was unused.
                // The types QuizQuestion, QuestionOption, MediaPosition are used above in type annotations.
                successfulRows++;
            } catch (err: any) {
                processingErrors.push({ row: rowIndexForUser, error: err.message || 'Unknown error processing row.' });
            }
        }

        let finalMessage = `Bulk upload processing complete. ${successfulRows} questions (for ${Object.keys(quizIdCache).length} quizzes, ${quizzesCreatedCount} new) processed.`;
        if (processingErrors.length > 0) finalMessage += ` ${processingErrors.length} rows had errors.`;
        const responsePayload = { message: finalMessage, successfulRows, failedRows: processingErrors.length, errors: processingErrors };
        console.log("API About to send JSON response:", JSON.stringify(responsePayload));
        return NextResponse.json(responsePayload, { status: processingErrors.length > 0 ? 207 : 200 });

    } catch (error: any) {
        console.error('Bulk upload API error (outer catch):', error);
        const errorResponsePayload = { message: 'Failed to process CSV file.', error: error.message, errors: processingErrors };
        console.log("API About to send ERROR JSON response:", JSON.stringify(errorResponsePayload));
        return NextResponse.json(errorResponsePayload, { status: 500 });
    }
}