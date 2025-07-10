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

interface UserProfile {
  id: string;
  full_name?: string | null;
}

function getDisplayName(profile: UserProfile | undefined, fallbackId: string) {
  if (profile && profile.full_name && profile.full_name.trim() !== '') return profile.full_name;
  if (profile) return '(no name)';
  return fallbackId;
}

export default function ChatList({ onSelectChat }: { onSelectChat: (chat: Chat) => void }) {
  const { user, profile } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignedCoach, setAssignedCoach] = useState<UserProfile | null>(null);
  const [assignedClients, setAssignedClients] = useState<UserProfile[]>([]);
  const [creatingChatId, setCreatingChatId] = useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});

  // Fetch chats
  useEffect(() => {
    setLoading(true);
    fetch('/api/chats')
      .then(r => r.json())
      .then(setChats)
      .finally(() => setLoading(false));
  }, []);

  // Fetch assigned coach (if user is client)
  useEffect(() => {
    if (!user || profile?.role === 'coach') return;
    fetch('/api/my-coach')
      .then(r => r.json())
      .then(data => {
        if (data.coaches && data.coaches.length > 0) {
          setAssignedCoach(data.coaches[0]);
        }
      });
  }, [user, profile]);

  // Fetch assigned clients (if user is coach)
  useEffect(() => {
    if (!user || profile?.role !== 'coach') return;
    fetch('/api/my-clients')
      .then(r => r.json())
      .then(data => {
        setAssignedClients(data.clients || []);
      });
  }, [user, profile]);

  // Fetch user profiles for all users in chats
  useEffect(() => {
    // Collect all unique user IDs from chats, assignedCoach, assignedClients
    const ids = new Set<string>();
    chats.forEach(chat => {
      ids.add(chat.coach_id);
      ids.add(chat.client_id);
    });
    if (assignedCoach) ids.add(assignedCoach.id);
    assignedClients.forEach(c => ids.add(c.id));
    // Don't fetch if no IDs
    if (ids.size === 0) return;
    // Fetch profiles in bulk
    fetch('/api/profiles?ids=' + Array.from(ids).join(','))
      .then(r => r.json())
      .then((profiles: UserProfile[]) => {
        const map: Record<string, UserProfile> = {};
        profiles.forEach(p => { map[p.id] = p; });
        setUserProfiles(map);
      });
  }, [chats, assignedCoach, assignedClients]);

  // Helper: find chat with a given user
  const findChatWith = (otherUserId: string) => {
    if (!user) return null;
    return chats.find(
      c =>
        (c.coach_id === user.id && c.client_id === otherUserId) ||
        (c.client_id === user.id && c.coach_id === otherUserId)
    );
  };

  // Start a new chat
  const handleStartChat = async (coachId: string, clientId: string) => {
    setCreatingChatId(coachId + '-' + clientId);
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coach_id: coachId, client_id: clientId }),
      });
      const chat = await res.json();
      if (chat && chat.id) {
        setChats(prev => [...prev, chat]);
        onSelectChat(chat);
      }
    } finally {
      setCreatingChatId(null);
    }
  };

  if (loading) return <div>Loading chats…</div>;
  if (!user) return null;

  return (
    <div>
      <h2 className="text-lg font-bold mb-2">Chats</h2>
      <ul>
        {chats.map(chat => {
          // Show the "other" user's name
          let otherUserId = user.id === chat.coach_id ? chat.client_id : chat.coach_id;
          let labelPrefix = user.id === chat.coach_id ? 'Client: ' : 'Coach: ';
          const otherProfile = userProfiles[otherUserId];
          return (
            <li key={chat.id} className="mb-2">
              <Button onClick={() => onSelectChat(chat)}>
                {labelPrefix}{getDisplayName(otherProfile, otherUserId)}
              </Button>
            </li>
          );
        })}
      </ul>

      {/* If client, show "Start Chat with My Coach" if not already in a chat */}
      {profile?.role !== 'coach' && assignedCoach && !findChatWith(assignedCoach.id) && (
        <div className="mt-4">
          <Button
            onClick={() => handleStartChat(assignedCoach.id, user.id)}
            disabled={!!creatingChatId}
          >
            {creatingChatId ? 'Starting chat...' : `Start Chat with My Coach`}
          </Button>
        </div>
      )}

      {/* If coach, show list of assigned clients not already in a chat */}
      {profile?.role === 'coach' && assignedClients.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold mb-2">Start Chat with Client</h3>
          <ul>
            {assignedClients
              .filter(client => !findChatWith(client.id))
              .map(client => (
                <li key={client.id} className="mb-2 flex items-center gap-2">
                  <span>{getDisplayName(userProfiles[client.id] || client, client.id)}</span>
                  <Button
                    size="sm"
                    onClick={() => handleStartChat(user.id, client.id)}
                    disabled={!!creatingChatId}
                  >
                    {creatingChatId ? 'Starting...' : 'Start Chat'}
                  </Button>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}