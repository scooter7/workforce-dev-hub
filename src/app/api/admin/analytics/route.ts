// src/app/api/admin/analytics/route.ts
import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabaseAdminClient'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain') ?? ''

    // 1) Topics & Subtopics
    const { data: chunks, error: chunksErr } = await supabaseAdmin
      .from('knowledge_base_chunks')
      .select('topic_id, subtopic_id')
    if (chunksErr) throw chunksErr

    const topicSet = new Set<string>()
    const subtopicSet = new Set<string>()
    chunks.forEach((r) => {
      if (r.topic_id) topicSet.add(r.topic_id)
      if (r.subtopic_id) subtopicSet.add(r.subtopic_id)
    })

    // 2) All users for domain filtering
    const { data: users, error: usersErr } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
    if (usersErr) throw usersErr

    const matchesDomain = (email: string) =>
      domain ? email.endsWith(`@${domain}`) : true

    // 3) Quizzes Taken
    const { data: attempts, error: attemptsErr } = await supabaseAdmin
      .from('quiz_attempts')
      .select('user_id')
    if (attemptsErr) throw attemptsErr

    const quizzesTaken = attempts.filter((a) => {
      const u = users.find((u) => u.id === a.user_id)
      return u && matchesDomain(u.email)
    }).length

    // 4) Goals Created / Completed
    const { data: goals, error: goalsErr } = await supabaseAdmin
      .from('user_goals')
      .select('user_id, status')
    if (goalsErr) throw goalsErr

    const filteredGoals = goals.filter((g) => {
      const u = users.find((u) => u.id === g.user_id)
      return u && matchesDomain(u.email)
    })
    const goalsCreated = filteredGoals.length
    const goalsCompleted = filteredGoals.filter((g) => g.status === 'completed').length

    return NextResponse.json({
      topics: topicSet.size,
      subtopics: subtopicSet.size,
      quizzesTaken,
      goalsCreated,
      goalsCompleted,
    })
  } catch (err: any) {
    console.error('Analytics error', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
