import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get coach assignments for this user
  const { data, error } = await supabase
    .from('coach_assignments')
    .select('coach_id')
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If there are no coaches assigned
  if (!data || data.length === 0) {
    return NextResponse.json({ coaches: [] });
  }

  // Fetch coach profiles for all assigned coach_ids
  const coachIds = data.map(a => a.coach_id);
  const { data: coachProfiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, company, role, updated_at')
    .in('id', coachIds);

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  // Merge coach_id with profile info
  const coaches = coachIds.map(coachId => {
    const profile = coachProfiles?.find(p => p.id === coachId) || {};
    return {
      coach_id: coachId,
      ...profile,
    };
  });

  return NextResponse.json({ coaches });
}