import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { supabaseAdminClient } from '@/lib/supabaseAdminClient';

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

  // Fetch all Auth users
  const { data: usersData, error: usersError } = await supabaseAdminClient.auth.admin.listUsers({ perPage: 1000 });
  if (usersError) {
    return <div>Error loading users: {usersError.message}</div>;
  }
  const allAuthUsers = usersData.users;

  // Fetch all profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, company, role, updated_at');
  if (profilesError) {
    return <div>Error loading profiles: {profilesError.message}</div>;
  }

  // Map by user id for quick lookup
  const profilesById = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
  const authUsersById = Object.fromEntries((allAuthUsers || []).map((u) => [u.id, u]));

  // Union of all user IDs from both sources
  const allUserIds = Array.from(
    new Set([
      ...Object.keys(authUsersById),
      ...Object.keys(profilesById),
    ])
  );

  // Merge info for display
  const mergedUsers = allUserIds.map((id) => {
    const authUser = authUsersById[id];
    const profile = profilesById[id];
    // Fallback: use email username if full_name is blank
    let displayName = profile?.full_name?.trim();
    if (!displayName && authUser?.email) {
      displayName = authUser.email.split('@')[0];
    }
    return {
      id,
      email: authUser?.email || '',
      full_name: displayName || '',
      company: profile?.company || '',
      role: profile?.role || 'user',
      updated_at: profile?.updated_at || '',
    };
  });

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
            {mergedUsers.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-2">{u.full_name ? u.full_name : <span className="text-gray-400 italic">(not set)</span>}</td>
                <td className="px-4 py-2">{u.email || <span className="text-gray-400 italic">(not registered)</span>}</td>
                <td className="px-4 py-2">{u.company || '-'}</td>
                <td className="px-4 py-2">{u.role || 'user'}</td>
                <td className="px-4 py-2">{u.updated_at ? new Date(u.updated_at).toLocaleDateString() : '-'}</td>
                <td className="px-4 py-2">
                  <a
                    href={`/admin/users/${u.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}