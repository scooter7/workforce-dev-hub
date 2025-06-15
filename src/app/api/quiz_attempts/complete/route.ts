// src/app/api/quiz_attempts/complete/route.ts
import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabaseAdminClient'

export async function POST(request: Request) {
  const body = await request.json()
  const { userId, quizId } = body

  try {
    // 1️⃣ Mark attempt completed
    const { error: attErr } = await supabaseAdmin
      .from('quiz_attempts')
      .insert({ user_id: userId, quiz_id: quizId, status: 'completed' })
    if (attErr) throw attErr

    // 2️⃣ Fetch the quiz description
    const { data: quiz, error: quizErr } = await supabaseAdmin
      .from('quizzes')
      .select('description')
      .eq('id', quizId)
      .single()
    if (quizErr) throw quizErr

    // 3️⃣ Award points (static 10 pts; adjust as desired)
    const pointsToAward = 10
    const description = quiz.description || `Quiz ${quizId}`

    const { error: logErr } = await supabaseAdmin
      .from('point_logs')
      .insert({
        user_id: userId,
        points: pointsToAward,
        description,
      })
    if (logErr) throw logErr

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('complete quiz error', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
