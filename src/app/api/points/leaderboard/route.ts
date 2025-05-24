import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server'; // Using server client for read access

export const dynamic = 'force-dynamic'; // Ensure fresh data

export async function GET(req: NextRequest) {
  const supabase = createSupabaseServerClient();

  // Optional: Authenticate if leaderboard is not fully public,
  // but generally leaderboards are viewable by authenticated users.
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    // Allow access for now, but you could restrict it.
    // console.warn('Leaderboard access attempt without user session (or error).');
    // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const LEADERBOARD_LIMIT = 10; // How many top users to show

  try {
    const { data: leaderboardData, error } = await supabase
      .from('profiles') // Your table storing user profiles and points
      .select('id, full_name, points') // Ensure these columns exist
      .not('points', 'is', null) // Exclude users with null points, if any
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