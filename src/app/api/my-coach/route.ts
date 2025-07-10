import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get coach assignments for this user, join coach profile
  const { data, error } = await supabase
    .from('coach_assignments')
    .select('coach_id, coach:profiles!coach_id(id, full_name, company, role, updated_at)')
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Optionally, flatten the result for easier consumption
  const coaches = (data || []).map(a => ({
    coach_id: a.coach_id,
    ...a.coach
  }));

  return NextResponse.json({ coaches });
}