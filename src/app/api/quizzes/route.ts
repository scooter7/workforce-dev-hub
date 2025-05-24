import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server'; // For read operations

export const dynamic = 'force-dynamic'; // Ensure fresh data for quiz list

export async function GET(req: NextRequest) {
  const supabase = createSupabaseServerClient();

  // Optional: Authenticate user. Usually, listing quizzes is fine for any authenticated user.
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    // Depending on policy, you might allow public viewing or restrict.
    // For now, let's assume it's for authenticated users but doesn't strictly fail if no session.
    // The page calling this is auth-protected anyway.
    // console.warn('GET /api/quizzes - Access attempt without user session (or error).');
  }

  // Future enhancement: Allow filtering by topic_id via searchParams
  // const { searchParams } = new URL(req.url);
  // const topicId = searchParams.get('topicId');

  try {
    let query = supabase
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
      .order('created_at', { ascending: false });

    // if (topicId) {
    //   query = query.eq('topic_id', topicId);
    // }

    const { data: quizzes, error } = await query;

    if (error) {
      console.error('Error fetching quizzes:', error);
      return NextResponse.json({ error: 'Failed to fetch quizzes.', details: error.message }, { status: 500 });
    }

    const formattedQuizzes = quizzes?.map(q => ({
      id: q.id,
      topic_id: q.topic_id,
      subtopic_id: q.subtopic_id,
      title: q.title,
      description: q.description,
      difficulty: q.difficulty,
      created_at: q.created_at,
      // @ts-ignore Supabase TS might struggle with related table count in this simple select
      question_count: q.quiz_questions && q.quiz_questions.length > 0 ? q.quiz_questions[0].count : 0,
    })) || [];

    return NextResponse.json(formattedQuizzes, { status: 200 });

  } catch (error: any) {
    console.error('GET /api/quizzes - Generic Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message }, { status: 500 });
  }
}