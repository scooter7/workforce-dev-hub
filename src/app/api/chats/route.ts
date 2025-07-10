import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get all chats where user is coach or client
  const { data: chats, error } = await supabase
    .from('chats')
    .select('id, coach_id, client_id, created_at')
    .or(`coach_id.eq.${user.id},client_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(chats);
}

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { coach_id, client_id } = await req.json();

  // Only allow creating a chat if user is coach or client
  if (user.id !== coach_id && user.id !== client_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Check if chat already exists
  const { data: existing } = await supabase
    .from('chats')
    .select('id')
    .eq('coach_id', coach_id)
    .eq('client_id', client_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(existing, { status: 200 });
  }

  // Create new chat
  const { data: chat, error } = await supabase
    .from('chats')
    .insert({ coach_id, client_id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(chat, { status: 201 });
}