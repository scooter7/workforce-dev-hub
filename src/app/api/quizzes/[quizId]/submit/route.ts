// src/app/api/quizzes/[quizId]/submit/route.ts

import { NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database.types';

export async function POST(
  request: Request,
  { params }: { params: { quizId: string } }
) {
  // Initialize Supabase client bound to this route
  const supabase = createRouteHandlerSupabaseClient<Database>({ request });

  // Authenticate user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  // Parse submitted answers
  const { answers } = await request.json();

  // Fetch correct answers for this quiz
  const { data: questions, error: fetchError } = await supabase
    .from('quiz_questions')
    .select('id, correct_answer')
    .eq('quiz_id', params.quizId);
  if (fetchError || !questions) {
    console.error('Error fetching quiz questions:', fetchError);
    return NextResponse.json(
      { error: 'Failed to fetch quiz questions' },
      { status: 500 }
    );
  }

  // Compute score
  let score = 0;
  questions.forEach((q, idx) => {
    if (answers[idx] === q.correct_answer) {
      score++;
    }
  });

  // Log the quiz attempt
  const { data: attempt, error: insertError } = await supabase
    .from('quiz_attempts')
    .insert({
      user_id: user.id,
      quiz_id: params.quizId,
      score,
      status: 'completed',
    })
    .select()
    .single();
  if (insertError) {
    console.error('Error inserting quiz_attempt:', insertError);
  }

  // Award points for taking the quiz (unconditional)
  const pointsToAward = 10;

  // 1) Increment the user's point total
  const { error: rpcError } = await supabase.rpc('increment_user_points', {
    user_id_param: user.id,
    points_to_add: pointsToAward,
  });
  if (rpcError) {
    console.error('Error incrementing user points:', rpcError);
  }

  // 2) Insert a log entry
  const { error: logError } = await supabase
    .from('point_logs')
    .insert({
      user_id: user.id,
      points_awarded: pointsToAward,
      reason_code: 'QUIZ_TAKEN',
      reason_message: `Completed quiz ${params.quizId}`,
      related_entity_id: params.quizId,
      related_entity_type: 'quiz',
    });
  if (logError) {
    console.error('Error inserting point_log:', logError);
  }

  // Return the user’s score (and attempt record if needed)
  return NextResponse.json({ score, attempt });
}
