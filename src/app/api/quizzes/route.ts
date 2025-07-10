// src/app/api/quizzes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'  // Always fetch fresh data

export async function GET(_req: NextRequest) {
  const supabase = createSupabaseServerClient()

  // 1️⃣ Get current user
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error('Not authenticated')
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    // 2️⃣ Fetch all quizzes
    const { data: quizzes, error: quizErr } = await supabase
      .from('quizzes')
      .select(`
        id,
        topic_id,
        subtopic_id,
        title,
        description,
        difficulty,
        created_at,
        quiz_questions ( count )
      `)
      .order('created_at', { ascending: false })

    if (quizErr) {
      console.error('Error fetching quizzes:', quizErr)
      return NextResponse.json(
        { error: 'Failed to fetch quizzes.', details: quizErr.message },
        { status: 500 }
      )
    }

    // 3️⃣ Fetch this user’s completed quiz attempts
    const { data: attempts, error: attErr } = await supabase
      .from('quiz_attempts')
      .select('quiz_id')
      .eq('user_id', user.id)
      .eq('status', 'completed')

    if (attErr) {
      console.error('Error fetching quiz attempts:', attErr)
      return NextResponse.json(
        { error: 'Failed to fetch attempts.', details: attErr.message },
        { status: 500 }
      )
    }

    const completedSet = new Set<string>(attempts.map(a => a.quiz_id))

    // 4️⃣ Format quizzes and add `completed` flag
    const formattedQuizzes = (quizzes || []).map(q => ({
      id: q.id,
      topic_id: q.topic_id,
      subtopic_id: q.subtopic_id,
      title: q.title,
      description: q.description,
      difficulty: q.difficulty,
      created_at: q.created_at,
      // @ts-ignore: quiz_questions[0].count
      question_count: q.quiz_questions?.[0]?.count ?? 0,
      completed: completedSet.has(q.id),
    }))

    return NextResponse.json(formattedQuizzes, { status: 200 })
  } catch (error: any) {
    console.error('GET /api/quizzes - Unexpected Error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred.', details: error.message },
      { status: 500 }
    )
  }
}
