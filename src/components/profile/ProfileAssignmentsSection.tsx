'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';

interface Coach {
  coach_id: string;
  full_name?: string;
  company?: string;
  role?: string;
  updated_at?: string;
  email?: string;
}

interface Client {
  user_id: string;
  full_name?: string;
  company?: string;
  role?: string;
  updated_at?: string;
  email?: string;
}

function getDisplayName(obj: { full_name?: string; email?: string; id?: string }) {
  if (obj.full_name && obj.full_name.trim() !== '') return obj.full_name;
  if (obj.email && obj.email.trim() !== '') return obj.email;
  if (obj.id && obj.id.length > 6) return obj.id.slice(0, 6) + '...';
  return '(no name)';
}

export default function ProfileAssignmentsSection() {
  const { user, profile } = useAuth();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCoach = profile?.role === 'coach';

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError(null);

    if (isCoach) {
      fetch('/api/my-clients')
        .then(r => r.json())
        .then(data => {
          setClients(data.clients || []);
        })
        .catch(e => setError(e.message))
        .finally(() => setLoading(false));
    } else {
      fetch('/api/my-coach')
        .then(r => r.json())
        .then(data => {
          setCoaches(data.coaches || []);
        })
        .catch(e => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [user, isCoach]);

  if (!user) return null;

  if (loading) {
    return <div className="mt-8"><p>Loading assignments…</p></div>;
  }

  if (error) {
    return <div className="mt-8 text-red-600">{error}</div>;
  }

  // Coach: show clients
  if (isCoach) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">My Clients</h2>
        {clients.length === 0 ? (
          <p className="text-gray-500">You have no assigned clients yet.</p>
        ) : (
          <ul className="space-y-2">
            {clients.map((c) => (
              <li key={c.user_id} className="p-3 bg-gray-50 rounded border">
                <span className="font-medium">{getDisplayName(c)}</span>
                {c.company && <span className="ml-2 text-xs text-gray-500">({c.company})</span>}
                {c.role && <span className="ml-2 text-xs text-gray-400">[{c.role}]</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // User: show coach
  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-2">My Coach</h2>
      {coaches.length === 0 ? (
        <p className="text-gray-500">You have not been assigned a coach yet.</p>
      ) : (
        <ul className="space-y-2">
          {coaches.map((coach) => (
            <li key={coach.coach_id} className="p-3 bg-gray-50 rounded border">
              <span className="font-medium">{getDisplayName(coach)}</span>
              {coach.company && <span className="ml-2 text-xs text-gray-500">({coach.company})</span>}
              {coach.role && <span className="ml-2 text-xs text-gray-400">[{coach.role}]</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}