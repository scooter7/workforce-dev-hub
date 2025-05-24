import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server'; // For user-session-based or public data access
import { z } from 'zod';
import { QuizData, QuizQuestion, QuestionOption } from '@/app/(dashboard)/quizzes/[quizId]/page'; // Re-use types defined for the page

// Schema for validating route parameters
const paramsSchema = z.object({
  quizId: z.string().uuid({ message: "Invalid Quiz ID format." }),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { quizId: string } }
) {
  // Use the server client that respects RLS based on the user's session
  // or public read policies on your tables.
  const supabase = createSupabaseServerClient();

  try {
    // Optional: User authentication check.
    // If quizzes are only for logged-in users, this is good.
    // The page calling this is already auth-protected by DashboardLayout.
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      // console.warn('GET /api/quizzes/[quizId]/questions - User not authenticated or error.');
      // return NextResponse.json({ error: 'Unauthorized to fetch quiz questions.' }, { status: 401 });
      // For now, we'll proceed, assuming quiz data RLS handles visibility.
    }

    const paramsValidation = paramsSchema.safeParse(params);
    if (!paramsValidation.success) {
      return NextResponse.json({ error: 'Invalid Quiz ID.', details: paramsValidation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { quizId } = paramsValidation.data;

    const { data: quizInfo, error: quizInfoError } = await supabase
      .from('quizzes')
      .select('id, title, description, topic_id')
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
        let options: QuestionOption[] = [];
        if (q.question_type === 'multiple-choice') {
          const { data: opts, error: optsError } = await supabase
            .from('question_options')
            .select('id, question_id, option_text') // Importantly, DO NOT send `is_correct`
            .eq('question_id', q.id)
            .order('id');

          if (optsError) {
            console.error(`Error fetching options for question ${q.id}:`, optsError);
          } else {
            options = opts || [];
          }
        }
        fetchedQuestions.push({ ...q, options });
      }
    }

    const responseData: QuizData = {
        id: quizInfo.id,
        title: quizInfo.title,
        description: quizInfo.description,
        topic_id: quizInfo.topic_id,
        questions: fetchedQuestions,
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error: any) {
    console.error('GET /api/quizzes/[quizId]/questions - Generic Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message }, { status: 500 });
  }
}