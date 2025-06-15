// src/app/api/points/route.ts
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createSupabaseServerClient()

  // 1) Get current user
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // 2) Fetch point logs, aliasing points_awarded → points
  const { data, error } = await supabase
    .from('point_logs')
    .select('id, points_awarded AS points, description, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
