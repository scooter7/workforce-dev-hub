export const revalidate = 0;

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdminClient } from '@/lib/supabaseAdminClient';
import { notFound } from 'next/navigation';
import AssignUsersClientTable from '@/components/admin/AssignUsersClientTable';
import { useState } from 'react';

export const metadata = {
  title: 'User Management',
};

export default async function AdminUsersPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check admin
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single();

  if (!user || adminProfile?.role !== 'admin') {
    notFound();
  }

  // Use the admin client to fetch all profiles (bypasses RLS)
  const { data: profiles, error: profilesError } = await supabaseAdminClient
    .from('profiles')
    .select('id, full_name, company, role, updated_at');
  if (profilesError) {
    return <div>Error loading profiles: {profilesError.message}</div>;
  }

  // --- Client-side Backfill Button ---
  // This is a client component, so we need to use a dynamic import for the button
  // to avoid hydration mismatch. We'll render it below the heading.

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>
      <BackfillProfilesButton />
      <AssignUsersClientTable profiles={profiles || []} />
    </div>
  );
}

// --- Client Button Component ---
'use client';

import { useState } from 'react';

function BackfillProfilesButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBackfill = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/users/backfill-profiles', {
        method: 'POST',
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        setError('Server returned invalid JSON: ' + text);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError(data.error || data.message || 'Unknown error');
      } else {
        setResult(data.message || 'Backfill complete.');
      }
      // For debugging: log the full response
      // eslint-disable-next-line no-console
      console.log('Backfill response:', data);
    } catch (e: any) {
      setError(e.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <button
        onClick={handleBackfill}
        disabled={loading}
        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
      >
        {loading ? 'Backfilling...' : 'Admin: Backfill Profiles'}
      </button>
      {result && (
        <div className="mt-2 text-green-700 bg-green-100 p-2 rounded">{result}</div>
      )}
      {error && (
        <div className="mt-2 text-red-700 bg-red-100 p-2 rounded">{error}</div>
      )}
    </div>
  );
}