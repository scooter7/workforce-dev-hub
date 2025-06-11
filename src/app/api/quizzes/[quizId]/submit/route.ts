import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

// Zod schema for the incoming answers payload
const AnswersSchema = z.object({
  answers: z.record(z.string().uuid(), z.string().uuid()),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = AnswersSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }
    const { answers } = parsed.data;

    // Fetch all questions and their correct options for this quiz to calculate the score on the server
    const { data: questionsWithOptions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('id, points, options:quiz_question_options(id, is_correct)')
      .eq('quiz_id', params.quizId);

    if (questionsError) {
      return NextResponse.json({ error: 'Could not retrieve quiz questions.' }, { status: 500 });
    }

    // Calculate score
    let score = 0;
    for (const question of questionsWithOptions) {
      const correctOption = question.options.find((o) => o.is_correct);
      if (correctOption && correctOption.id === answers[question.id]) {
        score += question.points;
      }
    }

    // Insert a record of the attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: params.quizId,
        user_id: user.id,
        score: score,
      })
      .select('id')
      .single();
    
    if (attemptError) {
        return NextResponse.json({ error: 'Failed to save quiz attempt.' }, { status: 500 });
    }
    
    // --- START OF FIX ---
    // If the user scored points, call the database function to award them.
    if (score > 0) {
      const { error: pointsError } = await supabase.rpc('award_points', {
        user_id_input: user.id,
        points_to_add: score,
      });

      if (pointsError) {
        // Log the error but don't fail the request, as the quiz attempt was still saved.
        console.error("Failed to award points:", pointsError);
      }
    }
    // --- END OF FIX ---

    // Insert individual answers for detailed review later
    const userAnswers = Object.entries(answers).map(([question_id, option_id]) => ({
      attempt_id: attempt.id,
      question_id,
      selected_option_id: option_id,
      user_id: user.id,
    }));

    await supabase.from('user_answers').insert(userAnswers);

    return NextResponse.json({
      message: 'Quiz submitted successfully',
      score,
      quizAttemptId: attempt.id,
    });
  } catch(e: any) {
    console.error("Unexpected error in quiz submission:", e);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
