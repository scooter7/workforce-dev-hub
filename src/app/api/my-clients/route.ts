import { createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdminClient } from '@/lib/supabaseAdminClient';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get user assignments for this coach (user context is fine)
  const { data, error } = await supabase
    .from('coach_assignments')
    .select('user_id')
    .eq('coach_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const userIds = (data || []).map(a => a.user_id);

  // Use the admin client to fetch profiles and emails
  let clients: any[] = [];
  if (userIds.length > 0) {
    // 1. Get profiles
    const { data: profiles, error: profilesError } = await supabaseAdminClient
      .from('profiles')
      .select('id, full_name, company, role, updated_at')
      .in('id', userIds);

    if (profilesError) return NextResponse.json({ error: profilesError.message }, { status: 500 });

    // 2. Get emails from Auth
    let emailsById: Record<string, string> = {};
    const { data: usersData } = await supabaseAdminClient.auth.admin.listUsers({ perPage: 1000 });
    if (usersData?.users) {
      for (const u of usersData.users) {
        if (userIds.includes(u.id)) {
          emailsById[u.id] = u.email || '';
        }
      }
    }

    // Merge user_id with profile info and email
    clients = userIds.map(userId => {
      const profile = profiles?.find(p => p.id === userId) || {};
      return {
        user_id: userId,
        ...profile,
        email: emailsById[userId] || '',
      };
    });
  }

  return NextResponse.json({ clients });
}