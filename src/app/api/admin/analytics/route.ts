import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabaseAdminClient'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain') || ''

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

    // 2) List all Auth users (service-role key required)
    const {
      data: usersData,
      error: usersErr
    } = await supabaseAdmin.auth.admin.listUsers({ /* optional paginationConfig */ })
    if (usersErr) throw usersErr

    // Build a set of user IDs matching the domain (or all if no domain)
    const allUsers = usersData.users
    const allowedUserIds = domain
      ? new Set(
          allUsers
            .filter((u) => u.email?.endsWith(`@${domain}`))
            .map((u) => u.id)
        )
      : new Set(allUsers.map((u) => u.id))

    // 3) Quizzes Taken
    const { data: attempts, error: attemptsErr } = await supabaseAdmin
      .from('quiz_attempts')
      .select('user_id')
    if (attemptsErr) throw attemptsErr

    const quizzesTaken = attempts.filter((a) =>
      allowedUserIds.has(a.user_id)
    ).length

    // 4) Goals Created / Completed
    const { data: goals, error: goalsErr } = await supabaseAdmin
      .from('user_goals')
      .select('user_id, status')
    if (goalsErr) throw goalsErr

    const filteredGoals = goals.filter((g) =>
      allowedUserIds.has(g.user_id)
    )
    const goalsCreated = filteredGoals.length
    const goalsCompleted = filteredGoals.filter((g) => g.status === 'completed').length

    return NextResponse.json({
      topics: topicSet.size,
      subtopics: subtopicSet.size,
      quizzesTaken,
      goalsCreated,
      goalsCompleted
    })
  } catch (err: any) {
    console.error('Analytics error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
