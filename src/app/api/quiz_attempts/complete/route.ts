import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'

export async function POST(request: Request) {
  const supabaseAdmin = createServerActionClient<Database>({ cookies })
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const {
    quizId,
    pointsToAward = 10,
    description = `Completed quiz ${quizId}`,
  } = await request.json()

  const { data: attempt, error: attemptError } = await supabaseAdmin
    .from('quiz_attempts')
    .insert({
      user_id: user.id,
      quiz_id: quizId,
      score: 0,
      status: 'completed',
    })
    .select()
    .single()
  if (attemptError) console.error(attemptError)

  const { error: rpcError } = await supabaseAdmin.rpc('increment_user_points', {
    user_id_param: user.id,
    points_to_add: pointsToAward,
  })
  if (rpcError) console.error(rpcError)

  const { error: logError } = await supabaseAdmin
    .from('point_logs')
    .insert({
      user_id: user.id,
      points_awarded: pointsToAward,
      reason_code: 'QUIZ_TAKEN',
      reason_message: description,
      related_entity_id: quizId,
      related_entity_type: 'quiz',
    })
  if (logError) console.error(logError)

  return NextResponse.json({ attempt })
}
