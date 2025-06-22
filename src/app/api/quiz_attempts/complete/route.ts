// src/app/api/quiz_attempts/complete/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database.types';

export async function POST(request: Request) {
  // Supabase admin client for server actions
  const supabaseAdmin = createServerActionClient<Database>({ cookies });

  // Authenticate
  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser();
  if (userError || !user) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  // Expecting { quizId, pointsToAward?, description? }
  const {
    quizId,
    pointsToAward = 10,
    description = `Completed quiz ${quizId}`,
  } = await request.json();

  // 1) Insert the quiz attempt record
  const { data: attempt, error: attemptError } = await supabaseAdmin
    .from('quiz_attempts')
    .insert({
      user_id: user.id,
      quiz_id: quizId,
      score: 0,
      status: 'completed',
    })
    .select()
    .single();
  if (attemptError) {
    console.error('Error inserting quiz_attempt:', attemptError);
  }

  // 2) Increment user’s total points
  const { error: rpcError } = await supabaseAdmin.rpc(
    'increment_user_points',
    {
      user_id_param: user.id,
      points_to_add: pointsToAward,
    }
  );
  if (rpcError) {
    console.error('Error incrementing user points:', rpcError);
  }

  // 3) Log the point award
  const { error: logError } = await supabaseAdmin
    .from('point_logs')
    .insert({
      user_id: user.id,
      points_awarded: pointsToAward,
      reason_code: 'QUIZ_TAKEN',
      reason_message: description,
      related_entity_id: quizId,
      related_entity_type: 'quiz',
    });
  if (logError) {
    console.error('Error inserting point_log:', logError);
  }

  return NextResponse.json({ attempt });
}
