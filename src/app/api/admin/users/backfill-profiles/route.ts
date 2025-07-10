import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdminClient } from '@/lib/supabaseAdminClient';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

export async function POST(req: NextRequest) {
  // Only allow admin to run this
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 1. Get all Auth users
  const { data: usersData, error: usersError } = await supabaseAdminClient.auth.admin.listUsers({ perPage: 1000 });
  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }
  const allAuthUsers = usersData.users;

  // 2. Get all profile IDs
  const { data: profiles, error: profilesError } = await supabaseAdminClient
    .from('profiles')
    .select('id');
  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }
  const profileIds = new Set((profiles || []).map((p) => p.id));

  // 3. Find users missing a profile row
  const missingUsers = allAuthUsers.filter((u) => !profileIds.has(u.id));

  // 4. Insert missing profiles
  const now = new Date().toISOString();
  const newProfiles = missingUsers.map((u) => ({
    id: u.id,
    full_name: u.user_metadata?.full_name || '',
    company: '',
    role: 'user',
    updated_at: now,
  }));

  let inserted = 0;
  let insertError = null;
  if (newProfiles.length > 0) {
    const { error } = await supabaseAdminClient
      .from('profiles')
      .insert(newProfiles);
    if (error) {
      insertError = error.message;
    } else {
      inserted = newProfiles.length;
    }
  }

  return NextResponse.json({
    message: `Backfill complete. Inserted ${inserted} new profiles.`,
    totalAuthUsers: allAuthUsers.length,
    totalExistingProfiles: profileIds.size,
    totalMissing: newProfiles.length,
    error: insertError,
  });
}