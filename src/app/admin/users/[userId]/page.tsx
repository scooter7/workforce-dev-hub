import { notFound } from 'next/navigation';
import ProfileForm from '@/components/profile/ProfileForm';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdminClient } from '@/lib/supabaseAdminClient';

export default async function EditUserPage({ params }: { params: { userId: string } }) {
  // Use the admin client for profile operations
  const supabase = supabaseAdminClient;
  const serverSupabase = createSupabaseServerClient();

  // Check admin permissions using the server client (user context)
  const { data: { user } } = await serverSupabase.auth.getUser();
  const { data: adminProfile } = await serverSupabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single();

  if (!user || adminProfile?.role !== 'admin') {
    notFound();
  }

  // Try to fetch the profile to edit
  let { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.userId)
    .single();

  // If not found, create a blank profile row for this user
  if ((!profile || error) && params.userId) {
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: params.userId,
        full_name: '',
        company: '',
        role: 'user',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    profile = newProfile;
    error = insertError;
  }

  if (error || !profile) {
    return <div>User not found.</div>;
  }

  // Try to get the email from Auth (using admin client)
  let email = '';
  const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (usersData?.users) {
    const found = usersData.users.find(u => u.id === params.userId);
    if (found) email = found.email || '';
  }

  // Always pass a valid user object (even if the user never logged in)
  const userObj = {
    id: profile.id,
    email,
    user_metadata: {},
    aud: '',
    app_metadata: {},
    created_at: '',
    confirmed_at: '',
    last_sign_in_at: '',
    role: '',
    updated_at: '',
  };

  // Pass the admin's profile as currentUserProfile for admin privileges
  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-4">Edit User Profile</h1>
      <ProfileForm user={userObj} initialProfileData={profile} currentUserProfile={adminProfile} />
    </div>
  );
}