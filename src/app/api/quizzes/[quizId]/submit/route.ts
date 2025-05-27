import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { POINTS_FOR_QUIZ_QUESTION_CORRECT } from '@/lib/constants'; // <<< CORRECTED IMPORT NAME
import { z } from 'zod';

const answerSchema = z.object({
  questionId: z.string().uuid(),
  selectedOptionId: z.string().uuid().nullable(),
});

const submissionSchema = z.object({
  attemptId: z.string().uuid().optional(),
  answers: z.array(answerSchema),
});

const paramsSchema = z.object({
  quizId: z.string().uuid({ message: "Invalid Quiz ID format." }),
});

interface QuestionWithOptions extends Record<string, any> { // Basic type for fetched questions
    id: string;
    points: number;
    explanation?: string | null;
    question_options: Array<{ id: string; is_correct: boolean; option_text: string }>;
}

export async function POST(
  req: NextRequest, // req is used for req.json()
  { params }: { params: { quizId: string } }
) {
  const supabaseUserClient = createSupabaseServerClient();
  const supabaseAdmin = createSupabaseAdminClient();

  try {
    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: User not authenticated.' }, { status: 401 });
    }

    const paramsValidation = paramsSchema.safeParse(params);
    if (!paramsValidation.success) {
      return NextResponse.json({ error: 'Invalid Quiz ID.', details: paramsValidation.error.flatten().fieldErrors }, { status: 400 });
    }
    const validatedQuizId = paramsValidation.data.quizId;

    let body;
    try {
        body = await req.json();
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    const bodyValidation = submissionSchema.safeParse(body);
    if (!bodyValidation.success) {
      return NextResponse.json({ error: 'Invalid submission data.', details: bodyValidation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { answers: submittedAnswers } = bodyValidation.data;

    const { data: quizInfo, error: quizInfoError } = await supabaseAdmin
        .from('quizzes')
        .select('title')
        .eq('id', validatedQuizId)
        .single();
    if (quizInfoError && quizInfoError.code !== 'PGRST116') {
        console.warn(`Quiz info not found for quizId: ${validatedQuizId} during submit`, quizInfoError);
    }
    const quizTitle = quizInfo?.title || `Quiz ID: ${validatedQuizId}`;

    const { data: questionsWithCorrectOptions, error: questionsError } = await supabaseAdmin
      .from('quiz_questions')
      .select(`
        id,
        points,
        explanation,
        question_options ( id, option_text, is_correct )
      `)
      .eq('quiz_id', validatedQuizId) as { data: QuestionWithOptions[] | null, error: any };

    if (questionsError || !questionsWithCorrectOptions) {
      console.error('Error fetching quiz questions/options for grading:', questionsError);
      return NextResponse.json({ error: 'Could not load quiz questions for grading.' }, { status: 500 });
    }
    if (questionsWithCorrectOptions.length === 0) {
        return NextResponse.json({ error: 'No questions found for this quiz to grade.' }, { status: 404 });
    }

    let score = 0;
    let pointsFromScore = 0;
    const processedUserAnswers: any[] = [];
    const questionsMap = new Map(questionsWithCorrectOptions.map(q => [q.id, q]));

    for (const userAnswer of submittedAnswers) {
      const question = questionsMap.get(userAnswer.questionId);
      if (!question) continue;

      const correctOption = question.question_options.find(opt => opt.is_correct);
      const isAnswerCorrect = correctOption?.id === userAnswer.selectedOptionId;

      if (isAnswerCorrect) {
        score += 1;
        pointsFromScore += question.points || POINTS_FOR_QUIZ_QUESTION_CORRECT; // Uses the imported constant
      }
      processedUserAnswers.push({
        question_id: userAnswer.questionId,
        selected_option_id: userAnswer.selectedOptionId,
        is_correct: isAnswerCorrect,
      });
    }

    const totalQuestions = questionsWithCorrectOptions.length;

    const attemptData = {
      user_id: user.id, quiz_id: validatedQuizId, score: score,
      total_questions: totalQuestions, questions_answered: submittedAnswers.length,
      status: 'completed' as const, completed_at: new Date().toISOString(),
      points_awarded: pointsFromScore,
    };

    const { data: newAttempt, error: attemptError } = await supabaseAdmin
      .from('quiz_attempts')
      .insert(attemptData)
      .select()
      .single();

    if (attemptError || !newAttempt) {
      console.error('Error saving quiz attempt:', attemptError);
      return NextResponse.json({ error: 'Failed to save quiz attempt.' }, { status: 500 });
    }

    const userAnswersWithAttemptId = processedUserAnswers.map(ans => ({ ...ans, attempt_id: newAttempt.id }));
    if (userAnswersWithAttemptId.length > 0) {
        const { error: userAnswersError } = await supabaseAdmin.from('user_answers').insert(userAnswersWithAttemptId);
        if (userAnswersError) console.error('Error saving user answers:', userAnswersError);
    }

    if (pointsFromScore > 0) {
      const { error: pointsUpdateError } = await supabaseAdmin
        .rpc('increment_user_points', { user_id_param: user.id, points_to_add: pointsFromScore });
      if (pointsUpdateError) {
        console.error('Error updating user total points:', pointsUpdateError);
      } else {
        const { error: logError } = await supabaseAdmin.from('point_logs').insert({
          user_id: user.id, points_awarded: pointsFromScore,
          reason_code: 'QUIZ_COMPLETED',
          reason_message: `Completed quiz: "${quizTitle}" - Score: ${score}/${totalQuestions}`,
          related_entity_id: newAttempt.id, related_entity_type: 'quiz_attempt',
        });
        if (logError) console.error('Error logging points for QUIZ_COMPLETED:', logError);
      }
    }

    const userChoicesForResponse: Record<string, { selected: string | null; correct: boolean; explanation?: string | null }> = {};
    questionsWithCorrectOptions.forEach(q => {
        const userAnswer = submittedAnswers.find(ua => ua.questionId === q.id);
        const correctOpt = q.question_options.find(opt => opt.is_correct);
        userChoicesForResponse[q.id] = {
            selected: userAnswer?.selectedOptionId || null,
            correct: userAnswer?.selectedOptionId === correctOpt?.id,
            explanation: q.explanation,
        };
    });

    return NextResponse.json({
      message: 'Quiz submitted successfully!', quizId: validatedQuizId, attemptId: newAttempt.id,
      score: score, totalQuestions: totalQuestions, pointsAwarded: pointsFromScore,
      userChoices: userChoicesForResponse,
    }, { status: 200 });

  } catch (error: any) {
    console.error('POST /api/quizzes/[quizId]/submit - Generic Error:', error);
    if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred processing your quiz submission.', details: error.message }, { status: 500 });
  }
}