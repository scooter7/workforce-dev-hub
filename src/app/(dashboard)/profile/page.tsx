import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfileForm from '@/components/profile/ProfileForm'; // We'll create this client component
import { User } from '@supabase/supabase-js';
import Link from 'next/link';

export const metadata = {
  title: 'My Profile',
};

// Define a type for the profile data we expect from the 'profiles' table
export interface UserProfile {
  id: string; // Should match auth.users.id
  full_name?: string | null;
  company?: string | null;
  role?: string | null; // e.g., 'Student', 'Software Engineer', 'Manager'
  // Add other fields from your 'profiles' table here
  updated_at?: string | null;
}

async function getUserProfile(supabase: any, user: User): Promise<UserProfile | null> {
  const { data: profile, error } = await supabase
    .from('profiles') // Your Supabase table name for user profiles
    .select('*')
    .eq('id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116: ' relazione "profiles" non contiene righe' (no rows found)
    console.error('Error fetching profile:', error);
    return null;
  }
  return profile;
}

export default async function ProfilePage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login?message=Please log in to view your profile.');
  }

  // Fetch existing profile data
  let userProfileData = await getUserProfile(supabase, user);

  // If no profile exists yet, create a default structure
  // This could also be handled by a trigger in Supabase upon user sign-up
  if (!userProfileData) {
    userProfileData = {
      id: user.id,
      full_name: user.user_metadata?.full_name || '', // Pre-fill from auth metadata if available
      company: '',
      role: '',
    };
  } else {
    // Ensure full_name is pre-filled if it's null in profiles but exists in user_metadata
    if (!userProfileData.full_name && user.user_metadata?.full_name) {
      userProfileData.full_name = user.user_metadata.full_name;
    }
  }


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-neutral-text mb-6">
          My Profile
        </h1>
        <p className="mb-2 text-sm text-gray-600">
          Email: <span className="font-medium text-gray-800">{user.email}</span>
        </p>
        <p className="mb-6 text-xs text-gray-500">
          (Email address is managed through account settings and cannot be changed here.)
        </p>

        {/* ProfileForm will be a client component to handle updates */}
        <ProfileForm user={user} initialProfileData={userProfileData as UserProfile} />

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-xl font-semibold text-neutral-text mb-4">Manage Goals</h2>
          <p className="text-gray-600 mb-4">
            Set, track, and achieve your personal and professional goals.
          </p>
          <Link href="/goals">
            <span /* Using span for Button styling compatibility */
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-secondary hover:bg-brand-secondary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary"
            >
              Go to My Goals
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}