import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest, { params }: { params: { chatId: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only allow if user is in the chat (RLS should enforce, but double check)
  const { data: chat } = await supabase
    .from('chats')
    .select('id, coach_id, client_id')
    .eq('id', params.chatId)
    .maybeSingle();

  if (!chat || (user.id !== chat.coach_id && user.id !== chat.client_id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: messages, error } = await supabase
    .from('chat_messages')
    .select('id, sender_id, message, created_at')
    .eq('chat_id', params.chatId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest, { params }: { params: { chatId: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { message } = await req.json();
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return NextResponse.json({ error: 'Message required' }, { status: 400 });
  }

  // Only allow if user is in the chat (RLS should enforce, but double check)
  const { data: chat } = await supabase
    .from('chats')
    .select('id, coach_id, client_id')
    .eq('id', params.chatId)
    .maybeSingle();

  if (!chat || (user.id !== chat.coach_id && user.id !== chat.client_id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: msg, error } = await supabase
    .from('chat_messages')
    .insert({
      chat_id: params.chatId,
      sender_id: user.id,
      message,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(msg, { status: 201 });
}