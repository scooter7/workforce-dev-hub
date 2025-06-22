import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
    .limit(20);

  if (error) {
    console.error('Error fetching quiz attempts:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz attempts' }, { status: 500 });
  }

  // Format the data for easier use on the client-side
  const formattedAttempts = data.map(attempt => {
    // FIX: Cast `attempt.quizzes` to `any` to bypass the incorrect compile-time type.
    // We know from the query that it will be a single object at runtime, not an array.
    const quizData = attempt.quizzes as any;
    
    return {
      id: attempt.id,
      completed_at: attempt.completed_at,
      score: attempt.score,
      total_questions: attempt.total_questions,
      title: quizData?.title || 'Unknown Quiz'
    };
  });

  return NextResponse.json(formattedAttempts);
}