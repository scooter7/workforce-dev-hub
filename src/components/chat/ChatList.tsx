'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import Button from '@/components/ui/Button';

interface Chat {
  id: string;
  coach_id: string;
  client_id: string;
  created_at: string;
}

export default function ChatList({ onSelectChat }: { onSelectChat: (chat: Chat) => void }) {
  const { user, profile } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/chats')
      .then(r => r.json())
      .then(setChats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading chats…</div>;
  if (!user) return null;

  return (
    <div>
      <h2 className="text-lg font-bold mb-2">Chats</h2>
      <ul>
        {chats.map(chat => (
          <li key={chat.id} className="mb-2">
            <Button onClick={() => onSelectChat(chat)}>
              {user.id === chat.coach_id ? `Client: ${chat.client_id}` : `Coach: ${chat.coach_id}`}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}