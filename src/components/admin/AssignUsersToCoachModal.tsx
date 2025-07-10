'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface User {
  id: string;
  full_name: string;
  company?: string | null;
  role?: string | null;
}

interface AssignUsersToCoachModalProps {
  coachId: string;
  isOpen: boolean;
  onClose: () => void;
  allUsers: User[];
}

export default function AssignUsersToCoachModal({ coachId, isOpen, onClose, allUsers }: AssignUsersToCoachModalProps) {
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch assigned users on open
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    fetch(`/api/admin/coaches/${coachId}/users`)
      .then(r => r.json())
      .then(data => {
        setAssignedUserIds((data.users || []).map((u: User) => u.id));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [coachId, isOpen]);

  const handleToggle = (userId: string) => {
    setAssignedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/coaches/${coachId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: assignedUserIds }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save assignments');
      }
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Users to Coach" size="lg">
      {loading ? (
        <div>Loading...</div>
      ) : (
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-4"
        >
          <div className="max-h-80 overflow-y-auto border rounded p-2 bg-gray-50">
            {allUsers.map(user => (
              <label key={user.id} className="flex items-center space-x-2 py-1">
                <input
                  type="checkbox"
                  checked={assignedUserIds.includes(user.id)}
                  onChange={() => handleToggle(user.id)}
                  className="h-4 w-4"
                />
                <span>{user.full_name}</span>
                {user.company && <span className="text-xs text-gray-500 ml-2">({user.company})</span>}
              </label>
            ))}
          </div>
          {error && <div className="text-red-600">{error}</div>}
          <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Assignments'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}