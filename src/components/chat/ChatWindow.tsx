'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface Message {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

export default function ChatWindow({ chatId }: { chatId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/chats/${chatId}/messages`)
      .then(r => r.json())
      .then(setMessages)
      .finally(() => setLoading(false));
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const res = await fetch(`/api/chats/${chatId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input }),
    });
    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setInput('');
    }
  };

  if (loading) return <div>Loading messages…</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-2">
        {messages.map((m) => (
          <div key={m.id} className={`mb-2 ${m.sender_id === user?.id ? 'text-right' : 'text-left'}`}>
            <span className="inline-block px-3 py-2 rounded bg-gray-200">{m.message}</span>
            <div className="text-xs text-gray-400">{new Date(m.created_at).toLocaleTimeString()}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form
        onSubmit={e => {
          e.preventDefault();
          sendMessage();
        }}
        className="flex gap-2 p-2 border-t"
      >
        <Input value={input} onChange={e => setInput(e.target.value)} className="flex-1" />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
}