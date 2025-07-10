'use client';

import { useState, FormEvent, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { UserProfile } from '@/app/(dashboard)/profile/page';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useRouter } from 'next/navigation';

interface ProfileFormProps {
  user: User;
  initialProfileData: UserProfile;
  currentUserProfile?: { role?: string | null }; // Add this prop for admin check
}

export default function ProfileForm({ user, initialProfileData, currentUserProfile }: ProfileFormProps) {
  const [fullName, setFullName] = useState(initialProfileData.full_name || '');
  const [company, setCompany] = useState(initialProfileData.company || '');
  const [role, setRole] = useState(initialProfileData.role || '');
  const [isCoach, setIsCoach] = useState(initialProfileData.role === 'coach');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setFullName(initialProfileData.full_name || '');
    setCompany(initialProfileData.company || '');
    setRole(initialProfileData.role || '');
    setIsCoach(initialProfileData.role === 'coach');
  }, [initialProfileData]);

  const isAdmin = currentUserProfile?.role === 'admin';

  const handleProfileUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setError(null);

    // If admin, allow updating the role field
    const updatedRole = isAdmin ? (isCoach ? 'coach' : 'user') : role;

    const profileUpdate = {
      full_name: fullName,
      company: company,
      role: updatedRole,
      updated_at: new Date().toISOString(),
    };

    try {
      let response, data;
      if (isAdmin) {
        // Use admin API route
        response = await fetch(`/api/admin/users/${user.id}/profile`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileUpdate),
        });
        data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to update profile');
        setMessage('Profile updated successfully!');
        // Force refresh the user list page so changes are visible immediately
        router.push('/admin/users');
        router.refresh();
        return;
      } else {
        // Normal user self-update
        const { data: _data, error: updateError } = await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('id', user.id)
          .select()
          .single();
        if (updateError) throw updateError;
      }
      setMessage('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleProfileUpdate} className="space-y-6">
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
          Full Name
        </label>
        <Input
          type="text"
          id="fullName"
          name="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your full name"
          disabled={isLoading}
          className="mt-1"
        />
      </div>

      <div>
        <label htmlFor="company" className="block text-sm font-medium text-gray-700">
          Company <span className="text-xs text-gray-500">(Optional)</span>
        </label>
        <Input
          type="text"
          id="company"
          name="company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Your company name"
          disabled={isLoading}
          className="mt-1"
        />
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
          Current Role <span className="text-xs text-gray-500">(e.g., Student, Software Engineer)</span>
        </label>
        <Input
          type="text"
          id="role"
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Your current role or student status"
          disabled={isLoading || isAdmin}
          className="mt-1"
        />
      </div>

      {/* Only show the Is Coach checkbox if the current user is an admin */}
      {isAdmin && (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isCoach"
            checked={isCoach}
            onChange={(e) => setIsCoach(e.target.checked)}
            disabled={isLoading}
            className="h-4 w-4"
          />
          <label htmlFor="isCoach" className="text-sm font-medium text-gray-700">
            Is Coach
          </label>
        </div>
      )}

      {message && (
        <p className="text-sm text-green-600 bg-green-100 p-3 rounded-md text-center">
          {message}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md text-center">
          {error}
        </p>
      )}

      <div>
        <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}