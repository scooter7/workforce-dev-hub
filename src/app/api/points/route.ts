// src/app/api/points/route.ts
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  // 1) Create the Supabase server client (reads auth cookie)
  const supabase = createSupabaseServerClient()

  // 2) Get the current user from the session
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

  // 3) Fetch the point_logs for that user
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

  // 4) Return the data
  return NextResponse.json(data)
}
