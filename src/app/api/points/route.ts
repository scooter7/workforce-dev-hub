// src/app/api/points/route.ts
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  // Initialize Supabase server client (reads auth cookie)
  const supabase = createSupabaseServerClient()

  // Retrieve the current user session
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

  // Fetch point logs for the authenticated user
  const { data, error } = await supabase
    .from('point_logs')
    .select('id, points, description, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(data)
}
