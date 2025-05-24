import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic'; // Ensure fresh data

export async function GET(_req: NextRequest) { // CHANGED: req to _req
  const supabase = createSupabaseServerClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('GET /api/points/log - Auth Error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const LOG_LIMIT = 10; // Number of recent activities to fetch

    const { data: pointLogs, error: logError } = await supabase
      .from('point_logs')
      .select('id, points_awarded, reason_code, reason_message, created_at, related_entity_type, related_entity_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(LOG_LIMIT);

    if (logError) {
      console.error('Error fetching point logs:', logError);
      return NextResponse.json({ error: 'Failed to fetch point activity.', details: logError.message }, { status: 500 });
    }

    const formattedLogs = pointLogs?.map(log => ({
        ...log,
        // Use reason_message if available, otherwise format reason_code
        reason: log.reason_message || log.reason_code.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
    })) || [];

    return NextResponse.json(formattedLogs, { status: 200 });

  } catch (error: any) {
    console.error('GET /api/points/log - Generic Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message }, { status: 500 });
  }
}