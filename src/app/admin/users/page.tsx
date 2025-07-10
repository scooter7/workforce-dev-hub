import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ProfileForm from '@/components/profile/ProfileForm';
import { supabaseAdminClient } from '@/lib/supabaseAdminClient';

export const metadata = {
  title: 'User Management',
};

export default async function AdminUsersPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch the admin's profile to check permissions
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single();

  if (!user || adminProfile?.role !== 'admin') {
    notFound();
  }

  // Fetch all users from Supabase Auth (admin API)
  const { data: usersData, error: usersError } = await supabaseAdminClient.auth.admin.listUsers({ perPage: 1000 });
  if (usersError) {
    return <div>Error loading users: {usersError.message}</div>;
  }
  const allUsers = usersData.users;

  // Fetch all profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, company, role, updated_at');
  if (profilesError) {
    return <div>Error loading profiles: {profilesError.message}</div>;
  }

  // Map profiles by user id for quick lookup
  const profilesById = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Company</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left">Last Updated</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((u) => {
              const profile = profilesById[u.id];
              return (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-2">{profile?.full_name || '(No name)'}</td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">{profile?.company || '-'}</td>
                  <td className="px-4 py-2">{profile?.role || 'user'}</td>
                  <td className="px-4 py-2">{profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-2">
                    <a
                      href={`/admin/users/${u.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}