import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { QuizData, QuizQuestion, QuestionOption } from '@/types/quiz';

const paramsSchema = z.object({
  quizId: z.string().uuid({ message: "Invalid Quiz ID format." }),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { quizId: string } }
) {
  const supabase = createSupabaseServerClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      // console.warn('GET /api/quizzes/[quizId]/questions - User not authenticated or error.');
    }

    const paramsValidation = paramsSchema.safeParse(params);
    if (!paramsValidation.success) {
      return NextResponse.json({ error: 'Invalid Quiz ID.', details: paramsValidation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { quizId } = paramsValidation.data;

    const { data: quizInfo, error: quizInfoError } = await supabase
      .from('quizzes')
      .select('id, title, description, topic_id, subtopic_id, difficulty')
      .eq('id', quizId)
      .single();

    if (quizInfoError || !quizInfo) {
      if (quizInfoError?.code === 'PGRST116') {
        return NextResponse.json({ error: 'Quiz not found.' }, { status: 404 });
      }
      console.error(`Error fetching quiz info for ${quizId}:`, quizInfoError);
      return NextResponse.json({ error: 'Could not load quiz details.' }, { status: 500 });
    }

    const { data: questionsRaw, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('id, quiz_id, question_text, question_type, explanation, points, order_num')
      .eq('quiz_id', quizId)
      .order('order_num', { ascending: true });

    if (questionsError) {
      console.error(`Error fetching questions for quiz ${quizId}:`, questionsError);
      return NextResponse.json({ error: 'Could not load quiz questions.' }, { status: 500 });
    }

    const fetchedQuestions: QuizQuestion[] = [];
    if (questionsRaw) {
      for (const q of questionsRaw) {
        let optionsForQuestion: QuestionOption[] = []; // Explicitly type this array
        if (q.question_type === 'multiple-choice') {
          const { data: optsData, error: optsError } = await supabase
            .from('question_options')
            .select('id, question_id, option_text') // Still NOT selecting is_correct
            .eq('question_id', q.id)
            .order('id');

          if (optsError) {
            console.error(`Error fetching options for question ${q.id}:`, optsError);
          } else if (optsData) {
            optionsForQuestion = optsData.map(opt => ({
              id: opt.id,
              question_id: opt.question_id, // or q.id
              option_text: opt.option_text,
              is_correct: false, // Add a default value to satisfy the type, client won't use it
            }));
          }
        }
        fetchedQuestions.push({ 
            id: q.id,
            quiz_id: q.quiz_id,
            question_text: q.question_text,
            question_type: q.question_type as 'multiple-choice' | 'true-false',
            explanation: q.explanation,
            points: q.points,
            order_num: q.order_num,
            options: optionsForQuestion, // Assign the correctly typed array
        });
      }
    }

    const responseData: QuizData = {
        id: quizInfo.id,
        title: quizInfo.title,
        description: quizInfo.description,
        topic_id: quizInfo.topic_id,
        subtopic_id: quizInfo.subtopic_id,
        difficulty: quizInfo.difficulty,
        questions: fetchedQuestions,
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error: any) {
    console.error('GET /api/quizzes/[quizId]/questions - Generic Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message }, { status: 500 });
  }
}