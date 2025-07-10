import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ProfileForm from '@/components/profile/ProfileForm';

export default async function EditUserPage({ params }: { params: { userId: string } }) {
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

  // Pass the admin's profile as currentUserProfile for admin privileges
  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-4">Edit User Profile</h1>
      <ProfileForm user={{ id: profile.id, email: '', user_metadata: {}, aud: '', app_metadata: {}, created_at: '', confirmed_at: '', last_sign_in_at: '', role: '', updated_at: '' }} initialProfileData={profile} currentUserProfile={adminProfile} />
    </div>
  );
}