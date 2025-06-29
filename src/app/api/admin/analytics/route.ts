// src/app/api/admin/analytics/route.ts
import { NextResponse } from 'next/server'
// Correctly import the named export
import { supabaseAdminClient } from '@/lib/supabaseAdminClient'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain') || ''

    // Use the renamed client variable
    const { data: chunks, error: chunksErr } = await supabaseAdminClient
      .from('knowledge_base_chunks')
      .select('topic_id, subtopic_id')
    if (chunksErr) throw chunksErr

    const topicSet = new Set<string>()
    const subtopicSet = new Set<string>()
    chunks.forEach((r) => {
      if (r.topic_id) topicSet.add(r.topic_id)
      if (r.subtopic_id) subtopicSet.add(r.subtopic_id)
    })

    // Use the renamed client variable
    const {
      data: usersData,
      error: usersErr
    } = await supabaseAdminClient.auth.admin.listUsers({ /* optional paginationConfig */ })
    if (usersErr) throw usersErr

    const allUsers = usersData.users
    const allowedUserIds = domain
      ? new Set(
          allUsers
            .filter((u) => u.email?.endsWith(`@${domain}`))
            .map((u) => u.id)
        )
      : new Set(allUsers.map((u) => u.id))

    // Use the renamed client variable
    const { data: attempts, error: attemptsErr } = await supabaseAdminClient
      .from('quiz_attempts')
      .select('user_id')
    if (attemptsErr) throw attemptsErr

    const quizzesTaken = attempts.filter((a) =>
      allowedUserIds.has(a.user_id)
    ).length

    // Use the renamed client variable
    const { data: goals, error: goalsErr } = await supabaseAdminClient
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