import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
// User type is from Supabase, no need to import if not directly used for typing here
import { TrophyIcon, StarIcon } from '@heroicons/react/24/solid';
import PointsPageClientContent from '@/components/points/PointsPageClientContent'; // Client component for dynamic lists

export const metadata = {
  title: 'My Points & Achievements',
};

// Type for user profile data (can be shared or defined in a types file)
export interface UserProfileWithPoints {
  id: string;
  full_name?: string | null;
  email?: string | null; // For leaderboard, if displaying email
  points: number;
}

async function getCurrentUserProfileWithPoints(supabase: any, userId: string): Promise<UserProfileWithPoints | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, points')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
    console.error('Error fetching user profile for points:', error);
    // Return a default structure or null based on how you want to handle missing profiles
    return { id: userId, points: 0, full_name: 'User (Profile not fully set up)' };
  }
  if (!profile) {
    // If profile genuinely doesn't exist (e.g. trigger failed or RLS issue on creation)
    return { id: userId, points: 0, full_name: 'User (No Profile)' };
  }

  // Ensure points is a number, default to 0 if null/undefined
  const points = (profile.points === null || profile.points === undefined) ? 0 : Number(profile.points);
  return { ...profile, points } as UserProfileWithPoints;
}

export default async function PointsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login?message=Please log in to view your points.');
  }

  const userProfile = await getCurrentUserProfileWithPoints(supabase, user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-10 text-center">
        <TrophyIcon className="h-20 w-20 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-neutral-text">
          Your Points & Achievements
        </h1>
      </div>

      {/* Current User's Points - server-rendered */}
      <section className="mb-12">
        <div className="max-w-md mx-auto bg-gradient-to-r from-brand-primary to-sky-600 text-white p-8 rounded-xl shadow-2xl text-center">
          <p className="text-2xl font-light mb-1">You currently have</p>
          <p className="text-6xl font-bold">
            {userProfile?.points ?? 0}
          </p>
          <p className="text-2xl font-light mt-1">Points!</p>
          <StarIcon className="h-8 w-8 text-yellow-300 mx-auto mt-4 opacity-80" />
        </div>
      </section>

      {/* Client component to handle leaderboard and recent activities fetching & display */}
      <PointsPageClientContent
        currentUserId={user.id}
        currentUserProfile={userProfile} // Pass current user's profile for highlighting
      />
    </div>
  );
}