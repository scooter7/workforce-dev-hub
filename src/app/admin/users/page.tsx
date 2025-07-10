import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ProfileForm from '@/components/profile/ProfileForm';

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

  // Fetch all users and their profiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, company, role, updated_at');

  if (error) {
    return <div>Error loading users: {error.message}</div>;
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
            {profiles?.map((profile) => (
              <tr key={profile.id} className="border-t">
                <td className="px-4 py-2">{profile.full_name || '(No name)'}</td>
                <td className="px-4 py-2">{profile.company || '-'}</td>
                <td className="px-4 py-2">{profile.role || 'user'}</td>
                <td className="px-4 py-2">{profile.updated_at ? new Date(profile.updated_at).toLocaleDateString() : '-'}</td>
                <td className="px-4 py-2">
                  <a
                    href={`/admin/users/${profile.id}`}
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