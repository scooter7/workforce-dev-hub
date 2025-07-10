import { createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdminClient } from '@/lib/supabaseAdminClient';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get coach assignments for this user (user context is fine)
  const { data, error } = await supabase
    .from('coach_assignments')
    .select('coach_id')
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!data || data.length === 0) {
    return NextResponse.json({ coaches: [] });
  }

  // Use the admin client to fetch coach profiles and emails
  const coachIds = data.map(a => a.coach_id);

  // 1. Get profiles
  const { data: coachProfiles, error: profileError } = await supabaseAdminClient
    .from('profiles')
    .select('id, full_name, company, role, updated_at')
    .in('id', coachIds);

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  // 2. Get emails from Auth
  let emailsById: Record<string, string> = {};
  if (coachIds.length > 0) {
    const { data: usersData } = await supabaseAdminClient.auth.admin.listUsers({ perPage: 1000 });
    if (usersData?.users) {
      for (const u of usersData.users) {
        if (coachIds.includes(u.id)) {
          emailsById[u.id] = u.email || '';
        }
      }
    }
  }

  // Merge coach_id with profile info and email
  const coaches = coachIds.map(coachId => {
    const profile = coachProfiles?.find(p => p.id === coachId) || {};
    return {
      coach_id: coachId,
      ...profile,
      email: emailsById[coachId] || '',
    };
  });

  return NextResponse.json({ coaches });
}