import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get user assignments for this coach, join user profile
  const { data, error } = await supabase
    .from('coach_assignments')
    .select('user_id, user:profiles!user_id(id, full_name, company, role, updated_at)')
    .eq('coach_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Optionally, flatten the result for easier consumption
  const clients = (data || []).map(a => ({
    user_id: a.user_id,
    ...a.user
  }));

  return NextResponse.json({ clients });
}