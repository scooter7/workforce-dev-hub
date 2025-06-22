import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Select all completed quiz attempts for the user and join with the quizzes table
  // to get the quiz title. This relies on the foreign key relationship.
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select(`
      id,
      completed_at,
      score,
      total_questions,
      quizzes ( title )
    `)
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(20); // Limit to the last 20 attempts for performance

  if (error) {
    console.error('Error fetching quiz attempts:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz attempts' }, { status: 500 });
  }

  // Format the data for easier use on the client-side
  const formattedAttempts = data.map(attempt => ({
    id: attempt.id,
    completed_at: attempt.completed_at,
    score: attempt.score,
    total_questions: attempt.total_questions,
    // The joined data comes in a nested object, so we extract the title
    title: attempt.quizzes?.title || 'Unknown Quiz'
  }));

  return NextResponse.json(formattedAttempts);
}