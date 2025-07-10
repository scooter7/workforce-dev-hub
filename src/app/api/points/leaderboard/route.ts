import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic'; // Ensure fresh data

export async function GET(_req: NextRequest) { // CHANGED: req to _req
  const supabase = createSupabaseServerClient();

  // Optional: Authenticate if leaderboard is not fully public.
  // The page calling this should already be authenticated.
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    // console.warn('Leaderboard access attempt without user session (or error).');
    // For now, assuming if the page is accessed, the user is auth'd.
    // If you want to strictly block API access without a session:
    // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const LEADERBOARD_LIMIT = 10;

  try {
    const { data: leaderboardData, error } = await supabase
      .from('profiles')
      .select('id, full_name, points') // Ensure these columns exist in your 'profiles' table
      .not('points', 'is', null)
      .order('points', { ascending: false })
      .limit(LEADERBOARD_LIMIT);

    if (error) {
      console.error('Error fetching leaderboard data:', error);
      return NextResponse.json({ error: 'Failed to fetch leaderboard data.', details: error.message }, { status: 500 });
    }

    return NextResponse.json(leaderboardData || [], { status: 200 });

  } catch (error: any) {
    console.error('GET /api/points/leaderboard - Generic Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message }, { status: 500 });
  }
}