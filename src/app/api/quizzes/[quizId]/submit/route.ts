import { NextRequest, NextResponse } from 'next/server';
// CORRECTED IMPORT: createSupabaseAdminClient is also from @/lib/supabase/server
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { POINTS_FOR_QUIZ_QUESTION_CORRECT } from '@/lib/constants';
import { z } from 'zod';

// Schema for validating individual answers in the request body
const answerSchema = z.object({
  questionId: z.string().uuid(),
  selectedOptionId: z.string().uuid().nullable(), // Nullable if user skipped or not applicable
});

// Schema for validating the overall request body
const submissionSchema = z.object({
  // quizId is from URL params
  // userId is from session
  attemptId: z.string().uuid().optional(), // Optional: if resuming an attempt
  answers: z.array(answerSchema),
});

// Schema for validating route parameters
const paramsSchema = z.object({
  quizId: z.string().uuid({ message: "Invalid Quiz ID format." }),
});

interface QuestionWithOptions extends Record<string, any> {
    id: string;
    points: number;
    explanation?: string | null;
    question_options: Array<{ id: string; is_correct: boolean; option_text: string }>;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { quizId: string } }
) {
  // createSupabaseServerClient is used here to get the authenticated user from the request context
  const supabaseUserClient = createSupabaseServerClient();
  const supabaseAdmin = createSupabaseAdminClient(); // For operations requiring broader access

  try {
    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();
    if (authError || !user) {
      console.error('POST /api/quizzes/[quizId]/submit - Auth Error:', authError);
      return NextResponse.json({ error: 'Unauthorized: User not authenticated.' }, { status: 401 });
    }

    // 2. Validate route parameter (quizId)
    const paramsValidation = paramsSchema.safeParse(params);
    if (!paramsValidation.success) {
      return NextResponse.json({ error: 'Invalid Quiz ID.', details: paramsValidation.error.flatten().fieldErrors }, { status: 400 });
    }
    const validatedQuizId = paramsValidation.data.quizId;

    // 3. Validate request body
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
    const { answers: submittedAnswers /*, attemptId: clientAttemptId */ } = bodyValidation.data;

    // 4. Fetch Quiz Title for logging (using admin client as quiz data might be public read but we need it reliably)
    const { data: quizInfo, error: quizInfoError } = await supabaseAdmin
        .from('quizzes')
        .select('title')
        .eq('id', validatedQuizId)
        .single();
    if (quizInfoError && quizInfoError.code !== 'PGRST116') { // PGRST116: no rows found
        console.warn(`Quiz info not found for quizId: ${validatedQuizId} during submit`, quizInfoError);
    }
    const quizTitle = quizInfo?.title || `Quiz ID: ${validatedQuizId}`;


    // 5. Fetch Quiz Questions and Correct Answers (SERVER-SIDE ONLY, using admin client)
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

    // 6. Grade the answers
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
        pointsFromScore += question.points || POINTS_PER_QUIZ_QUESTION_CORRECT;
      }
      processedUserAnswers.push({
        question_id: userAnswer.questionId,
        selected_option_id: userAnswer.selectedOptionId,
        is_correct: isAnswerCorrect,
      });
    }

    const totalQuestions = questionsWithCorrectOptions.length;

    // 7. Store Quiz Attempt (using admin client)
    const attemptData = {
      user_id: user.id,
      quiz_id: validatedQuizId,
      score: score,
      total_questions: totalQuestions,
      questions_answered: submittedAnswers.length,
      status: 'completed' as const,
      completed_at: new Date().toISOString(),
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

    // 8. Store User's Individual Answers, linking to the new attempt (using admin client)
    const userAnswersWithAttemptId = processedUserAnswers.map(ans => ({
      ...ans,
      attempt_id: newAttempt.id,
    }));

    if (userAnswersWithAttemptId.length > 0) {
        const { error: userAnswersError } = await supabaseAdmin
        .from('user_answers')
        .insert(userAnswersWithAttemptId);

        if (userAnswersError) {
        console.error('Error saving user answers:', userAnswersError);
        // Log error but continue, as the main attempt is saved.
        }
    }


    // 9. Update User's Total Points (if any points were awarded)
    if (pointsFromScore > 0) {
      const { error: pointsUpdateError } = await supabaseAdmin
        .rpc('increment_user_points', { user_id_param: user.id, points_to_add: pointsFromScore });
      if (pointsUpdateError) {
        console.error('Error updating user total points:', pointsUpdateError);
      } else {
        console.log(`Awarded ${pointsFromScore} points to user ${user.id} for quiz ${validatedQuizId}.`);
        const { error: logError } = await supabaseAdmin.from('point_logs').insert({
          user_id: user.id,
          points_awarded: pointsFromScore,
          reason_code: 'QUIZ_COMPLETED',
          reason_message: `Completed quiz: "${quizTitle}" - Score: ${score}/${totalQuestions}`,
          related_entity_id: newAttempt.id,
          related_entity_type: 'quiz_attempt',
        });
        if (logError) {
          console.error('Error logging points for QUIZ_COMPLETED:', logError);
        }
      }
    }

    // 10. Prepare response for the client
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
      message: 'Quiz submitted successfully!',
      quizId: validatedQuizId,
      attemptId: newAttempt.id,
      score: score,
      totalQuestions: totalQuestions,
      pointsAwarded: pointsFromScore,
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