import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdminClient } from '@/lib/supabaseAdminClient';

export async function PATCH(req: NextRequest, { params }: { params: { userId: string } }) {
  const userId = params.userId;
  const body = await req.json();

  // Only allow certain fields to be updated
  const { full_name, company, role } = body;

  console.log(`[ADMIN PROFILE PATCH] userId=${userId} full_name=${full_name} company=${company} role=${role}`);

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
    console.error('[ADMIN PROFILE PATCH ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log('[ADMIN PROFILE PATCH SUCCESS]', data);

  return NextResponse.json(data, { status: 200 });
}