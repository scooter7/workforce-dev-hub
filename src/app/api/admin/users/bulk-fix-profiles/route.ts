import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdminClient } from '@/lib/supabaseAdminClient';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

function isBlank(val: string | null | undefined) {
  return val === null || val === undefined || val.trim() === '' || val.trim().toUpperCase() === 'EMPTY';
}

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: usersData, error: usersError } = await supabaseAdminClient.auth.admin.listUsers({ perPage: 1000 });
  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }
  const allAuthUsers = usersData.users;
  const authUsersById = Object.fromEntries(allAuthUsers.map(u => [u.id, u]));

  const { data: profiles, error: profilesError } = await supabaseAdminClient
    .from('profiles')
    .select('id, full_name, company, role');
  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const updates = [];
  for (const profile of profiles) {
    let needsUpdate = false;
    let newFullName = profile.full_name;
    let newRole = profile.role;
    let newCompany = profile.company;

    if (isBlank(profile.full_name)) {
      const email = authUsersById[profile.id]?.email || '';
      newFullName = email ? email.split('@')[0] : '';
      needsUpdate = true;
    }
    if (isBlank(profile.role)) {
      newRole = 'user';
      needsUpdate = true;
    }
    if (isBlank(profile.company)) {
      newCompany = '';
      needsUpdate = true;
    }

    if (needsUpdate) {
      updates.push({
        id: profile.id,
        full_name: newFullName,
        role: newRole,
        company: newCompany,
        updated_at: new Date().toISOString(),
      });
    }
  }

  // DEBUG: Log what will be updated
  console.log('Bulk profile updates:', updates);

  let updated = 0;
  let updateError = null;
  if (updates.length > 0) {
    const { error } = await supabaseAdminClient
      .from('profiles')
      .upsert(updates, { onConflict: 'id' });
    if (error) {
      updateError = error.message;
    } else {
      updated = updates.length;
    }
  }

  return NextResponse.json({
    message: `Bulk fix complete. Updated ${updated} profiles.`,
    totalProfiles: profiles.length,
    attemptedUpdates: updates.length,
    error: updateError,
    debug: updates,
  });
}