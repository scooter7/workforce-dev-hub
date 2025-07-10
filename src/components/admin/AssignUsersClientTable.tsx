'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const AssignUsersToCoachModal = dynamic(() => import('./AssignUsersToCoachModal'), { ssr: false });

interface User {
  id: string;
  full_name: string;
  company?: string | null;
  role?: string | null;
  updated_at?: string | null;
}

interface Props {
  profiles: User[];
}

export default function AssignUsersClientTable({ profiles }: Props) {
  const [modalCoachId, setModalCoachId] = useState<string | null>(null);

  // Only users (not coaches or admins) can be assigned
  const assignableUsers = profiles.filter(p => p.role !== 'coach' && p.role !== 'admin');

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded shadow">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Company</th>
            <th className="px-4 py-2 text-left">Role</th>
            <th className="px-4 py-2 text-left">Last Updated</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {(profiles || []).map((u) => (
            <tr key={u.id} className="border-t">
              <td className="px-4 py-2">{u.full_name ? u.full_name : <span className="text-gray-400 italic">(not set)</span>}</td>
              <td className="px-4 py-2">{u.company || '-'}</td>
              <td className="px-4 py-2">{u.role || 'user'}</td>
              <td className="px-4 py-2">{u.updated_at ? new Date(u.updated_at).toLocaleDateString() : '-'}</td>
              <td className="px-4 py-2 space-x-2">
                <a
                  href={`/admin/users/${u.id}`}
                  className="text-blue-600 hover:underline"
                >
                  Edit
                </a>
                {u.role === 'coach' && (
                  <>
                    <button
                      className="ml-2 px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      onClick={() => setModalCoachId(u.id)}
                      type="button"
                    >
                      Assign Users
                    </button>
                    {modalCoachId === u.id && (
                      <AssignUsersToCoachModal
                        coachId={u.id}
                        isOpen={true}
                        onClose={() => setModalCoachId(null)}
                        allUsers={assignableUsers}
                      />
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}