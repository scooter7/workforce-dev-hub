'use client';

import { useState, FormEvent, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { UserProfile } from '@/app/(dashboard)/profile/page';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface ProfileFormProps {
  user: User;
  initialProfileData: UserProfile;
}

export default function ProfileForm({ user, initialProfileData }: ProfileFormProps) {
  const [fullName, setFullName] = useState(initialProfileData.full_name || '');
  const [company, setCompany] = useState(initialProfileData.company || '');
  const [role, setRole] = useState(initialProfileData.role || '');

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFullName(initialProfileData.full_name || '');
    setCompany(initialProfileData.company || '');
    setRole(initialProfileData.role || '');
  }, [initialProfileData]);

  const handleProfileUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setError(null);

    const profileUpdate = {
      full_name: fullName,
      company: company,
      role: role,
      updated_at: new Date().toISOString(),
    };

    // Using a direct update which is more explicit and works better with RLS.
    const { data: _data, error: updateError } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', user.id) // Explicitly target the user's row
      .select()
      .single();

    setIsLoading(false);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      setError(updateError.message || 'Failed to update profile. Please try again.');
    } else {
      setMessage('Profile updated successfully!');
      // _data contains the updated profile if you needed to use it, e.g., to update local state more precisely
      // console.log('Updated profile data:', _data);
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
          disabled={isLoading}
          className="mt-1"
        />
      </div>

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