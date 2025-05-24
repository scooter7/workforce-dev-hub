'use client';

import { useState, FormEvent, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client'; // Client-side Supabase instance
import { UserProfile } from '@/app/(dashboard)/profile/page'; // Import the UserProfile type
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
  // Add more fields here if your UserProfile interface expands

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Effect to update form fields if initialProfileData changes (e.g., after a server refresh)
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
      id: user.id, // Crucial for Supabase to know which row to update/insert
      full_name: fullName,
      company: company,
      role: role,
      updated_at: new Date().toISOString(), // Keep track of the last update
    };

    // Using upsert: updates if profile exists, inserts if it doesn't (based on 'id').
    // Ensure 'id' is the primary key and onConflict target.
    const { data, error: updateError } = await supabase
      .from('profiles')
      .upsert(profileUpdate, {
        onConflict: 'id', // Specify the column to check for conflicts (your primary key)
      })
      .select() // Optionally select the data back
      .single(); // If you expect one row back

    setIsLoading(false);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      setError(updateError.message || 'Failed to update profile. Please try again.');
    } else {
      setMessage('Profile updated successfully!');
      // Optionally, you could refresh router to ensure parent page re-fetches if needed,
      // but for simple form updates, just a message might be enough.
      // router.refresh();
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