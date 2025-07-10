import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdminClient } from '@/lib/supabaseAdminClient';

export async function GET(req: NextRequest) {
  const idsParam = req.nextUrl.searchParams.get('ids');
  if (!idsParam) return NextResponse.json([], { status: 200 });
  const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean);
  if (ids.length === 0) return NextResponse.json([], { status: 200 });

  const { data, error } = await supabaseAdminClient
    .from('profiles')
    .select('id, full_name')
    .in('id', ids);

  if (error) return NextResponse.json([], { status: 500 });
  return NextResponse.json(data || []);
}