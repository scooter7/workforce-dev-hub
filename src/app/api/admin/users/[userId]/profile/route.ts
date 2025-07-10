import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdminClient } from '@/lib/supabaseAdminClient';

export async function PATCH(req: NextRequest, { params }: { params: { userId: string } }) {
  const userId = params.userId;
  const body = await req.json();

  // Only allow certain fields to be updated
  const { full_name, company, role } = body;

  const { data, error } = await supabaseAdminClient
    .from('profiles')
    .upsert({
      id: userId,
      full_name: full_name ?? '',
      company: company ?? '',
      role: role ?? 'user',
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}