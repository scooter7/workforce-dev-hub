export const revalidate = 0;

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdminClient } from '@/lib/supabaseAdminClient';
import { notFound } from 'next/navigation';
import AssignUsersClientTable from '@/components/admin/AssignUsersClientTable';
import BackfillProfilesButton from '@/components/admin/BackfillProfilesButton';

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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>
      <BackfillProfilesButton />
      <AssignUsersClientTable profiles={profiles || []} />
    </div>
  );
}