export const revalidate = 0;

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdminClient } from '@/lib/supabaseAdminClient';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'User Management',
};

export default async function AdminUsersPage() {
  // Use the server client to check if the current user is admin
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