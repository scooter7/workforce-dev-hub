// src/app/api/points/route.ts
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createSupabaseServerClient()

  // 1) get current user
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    )
  }

  // 2) fetch the real columns
  const { data: rawLogs, error } = await supabase
    .from('point_logs')
    .select('id, points_awarded, reason_message, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  // 3) remap into { id, points, description, created_at }
  const formatted = rawLogs.map((log) => ({
    id: log.id,
    points: log.points_awarded,
    description: log.reason_message ?? '',
    created_at: log.created_at
  }))

  return NextResponse.json(formatted)
}
