// src/app/api/quizzes/[quizId]/submit/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/db';
import { z } from 'zod';

// Schema to validate the incoming request body
const submissionSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    answerId: z.string().uuid(),
    isCorrect: z.boolean(),
  }))
});

export async function POST(request: Request, { params }: { params: { quizId: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const validation = submissionSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid submission format', details: validation.error.issues }, { status: 400 });
  }

  const { answers } = validation.data;

  // Fetch question points from the database to calculate the score accurately
  const { data: questions, error: questionsError } = await supabase
    .from('quiz_questions')
    .select('id, points')
    .eq('quiz_id', params.quizId);

  if (questionsError) {
    console.error('Error fetching questions for score calculation:', questionsError);
    return NextResponse.json({ error: 'Could not retrieve quiz questions to calculate score.' }, { status: 500 });
  }

  // Create a map for quick point lookup
  const questionPointsMap = new Map(questions.map(q => [q.id, q.points]));
  
  // Calculate score based on client-provided correctness and DB-fetched points
  const score = answers.reduce((acc, ans) => {
    if (ans.isCorrect) {
      return acc + (questionPointsMap.get(ans.questionId) || 0);
    }
    return acc;
  }, 0);
  
  const { data: attempt, error: insertError } = await supabase
    .from('quiz_attempts')
    .insert({
      user_id: user.id,
      quiz_id: params.quizId,
      score: score,
      total_questions: questions.length,
      questions_answered: answers.length,
      status: 'completed',
      points_awarded: score, // Award points equal to the score
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    console.error("Error inserting quiz attempt:", insertError);
    return NextResponse.json({ error: 'Failed to save quiz attempt' }, { status: 500 });
  }

  if (score > 0) {
    const { error: rpcError } = await supabase.rpc('increment_user_points', {
      user_id_param: user.id,
      points_to_add: score
    });
    if (rpcError) console.error("RPC Error awarding points: ", rpcError);
    
    const { error: logError } = await supabase
      .from('point_logs')
      .insert({
        user_id: user.id,
        points_awarded: score,
        reason_code: 'QUIZ_COMPLETED',
        reason_message: `Completed quiz and scored ${score} points.`,
        related_entity_id: params.quizId,
        related_entity_type: 'quiz'
      });
    if (logError) console.error("Error logging points: ", logError);
  }

  return NextResponse.json({ score, attempt });
}