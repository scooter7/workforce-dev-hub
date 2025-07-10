import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { QuizData, QuizQuestion, QuestionOption } from '@/types/quiz'; // Ensure these types are correct

// Schema for validating route parameters
const paramsSchema = z.object({
  quizId: z.string().uuid({ message: "Invalid Quiz ID format." }),
});

export async function GET(
  _req: NextRequest, // Prefixed as unused
  { params }: { params: { quizId: string } }
) {
  const supabase = createSupabaseServerClient();

  try {
    // Optional: User authentication check if quizzes are not public
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      // console.warn('GET /api/quizzes/[quizId]/questions - User not authenticated or error.');
      // If strict auth is needed for this API:
      // return NextResponse.json({ error: 'Unauthorized to fetch quiz questions.' }, { status: 401 });
    }

    const paramsValidation = paramsSchema.safeParse(params);
    if (!paramsValidation.success) {
      return NextResponse.json({ error: 'Invalid Quiz ID.', details: paramsValidation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { quizId } = paramsValidation.data;

    // Fetch basic quiz information
    const { data: quizInfo, error: quizInfoError } = await supabase
      .from('quizzes')
      .select('id, title, description, topic_id, subtopic_id, difficulty')
      .eq('id', quizId)
      .single();

    if (quizInfoError || !quizInfo) {
      if (quizInfoError?.code === 'PGRST116') { // PGRST116: no rows found
        return NextResponse.json({ error: 'Quiz not found.' }, { status: 404 });
      }
      console.error(`Error fetching quiz info for ${quizId}:`, quizInfoError);
      return NextResponse.json({ error: 'Could not load quiz details.' }, { status: 500 });
    }

    // Fetch questions for the quiz, including new media fields
    const { data: questionsRaw, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('id, quiz_id, question_text, question_type, explanation, points, order_num, image_url, video_url, media_position')
      .eq('quiz_id', quizId)
      .order('order_num', { ascending: true });

    if (questionsError) {
      console.error(`Error fetching questions for quiz ${quizId}:`, questionsError);
      return NextResponse.json({ error: 'Could not load quiz questions.' }, { status: 500 });
    }

    const fetchedQuestions: QuizQuestion[] = [];
    if (questionsRaw) {
      for (const q of questionsRaw) {
        let optionsForQuestion: QuestionOption[] = [];
        // Fetch options for multiple-choice AND true-false types (if they store options)
        if (q.question_type === 'multiple-choice' || q.question_type === 'true-false') {
          const { data: optsData, error: optsError } = await supabase
            .from('question_options')
            .select('id, question_id, option_text, is_correct') // Crucially select is_correct
            .eq('question_id', q.id)
            .order('id'); // You might want a specific order for options

          if (optsError) {
            console.error(`Error fetching options for question ${q.id}:`, optsError);
            // Decide if you want to proceed without options or error out
          } else if (optsData) {
            optionsForQuestion = optsData.map(opt => ({
              id: opt.id,
              question_id: opt.question_id || q.id, // Ensure question_id is part of the option if needed
              option_text: opt.option_text,
              is_correct: opt.is_correct, // Pass the actual is_correct value
            }));
          }
        }
        
        fetchedQuestions.push({ 
            id: q.id,
            quiz_id: q.quiz_id, // This is part of QuizQuestion type
            question_text: q.question_text,
            question_type: q.question_type as 'multiple-choice' | 'true-false', // Type assertion
            explanation: q.explanation,
            points: q.points,
            order_num: q.order_num,
            image_url: q.image_url,
            video_url: q.video_url, // This will now contain the iframe embed code
            media_position: q.media_position as any, // Cast if MediaPosition type string literal causes an issue
            options: optionsForQuestion,
        });
      }
    }

    const responseData: QuizData = {
        id: quizInfo.id,
        title: quizInfo.title,
        description: quizInfo.description,
        topic_id: quizInfo.topic_id, // Assumes topic_id is NOT NULL in your quizzes table
        subtopic_id: quizInfo.subtopic_id,
        difficulty: quizInfo.difficulty,
        questions: fetchedQuestions,
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error: any) {
    console.error('GET /api/quizzes/[quizId]/questions - Generic Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred while fetching quiz questions.', details: error.message }, { status: 500 });
  }
}