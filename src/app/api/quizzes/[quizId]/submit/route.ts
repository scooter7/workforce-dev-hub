// src/app/api/quizzes/[quizId]/submit/route.ts
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/db'

export async function POST(request: Request, { params }: { params: { quizId: string } }) {
  const supabase = createRouteHandlerClient<Database>({ request })
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  const { answers } = await request.json()
  const { data: questions, error: fetchError } = await supabase
    .from('quiz_questions')
    .select('id, correct_answer')
    .eq('quiz_id', params.quizId)
  if (fetchError || !questions) {
    return NextResponse.json({ error: 'Failed to fetch quiz questions' }, { status: 500 })
  }
  let score = 0
  questions.forEach((q, idx) => {
    if (answers[idx] === q.correct_answer) score++
  })
  const { data: attempt, error: insertError } = await supabase
    .from('quiz_attempts')
    .insert({ user_id: user.id, quiz_id: params.quizId, score, status: 'completed' })
    .select()
    .single()
  if (insertError) console.error(insertError)
  const pointsToAward = 10
  const { error: rpcError } = await supabase.rpc('increment_user_points', {
    user_id_param: user.id,
    points_to_add: pointsToAward
  })
  if (rpcError) console.error(rpcError)
  const { error: logError } = await supabase
    .from('point_logs')
    .insert({
      user_id: user.id,
      points_awarded: pointsToAward,
      reason_code: 'QUIZ_TAKEN',
      reason_message: `Completed quiz ${params.quizId}`,
      related_entity_id: params.quizId,
      related_entity_type: 'quiz'
    })
  if (logError) console.error(logError)
  return NextResponse.json({ score, attempt })
}
