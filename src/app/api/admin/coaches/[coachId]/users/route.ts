import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdminClient } from '@/lib/supabaseAdminClient';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

// GET: List all users assigned to a coach
export async function GET(_req: NextRequest, { params }: { params: { coachId: string } }) {
  // Only allow admin
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get all user_ids assigned to this coach
  const { data: assignments, error } = await supabaseAdminClient
    .from('coach_assignments')
    .select('user_id')
    .eq('coach_id', params.coachId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Optionally, fetch user profiles
  const userIds = (assignments || []).map(a => a.user_id);
  let users = [];
  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabaseAdminClient
      .from('profiles')
      .select('id, full_name, company, role')
      .in('id', userIds);
    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }
    users = profiles;
  }

  return NextResponse.json({ users });
}

// POST: Assign users to a coach (replaces all assignments)
export async function POST(req: NextRequest, { params }: { params: { coachId: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const userIds: string[] = Array.isArray(body.userIds) ? body.userIds : [];

  // Remove all current assignments for this coach
  const { error: delError } = await supabaseAdminClient
    .from('coach_assignments')
    .delete()
    .eq('coach_id', params.coachId);

  if (delError) {
    return NextResponse.json({ error: delError.message }, { status: 500 });
  }

  // Insert new assignments
  if (userIds.length > 0) {
    const rows = userIds.map(uid => ({
      coach_id: params.coachId,
      user_id: uid,
    }));
    const { error: insError } = await supabaseAdminClient
      .from('coach_assignments')
      .insert(rows);
    if (insError) {
      return NextResponse.json({ error: insError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ message: 'Assignments updated' });
}