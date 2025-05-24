import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
//import { User } from '@supabase/supabase-js';
//import Link from 'next/link';
// We'll create these client components later:
import GoalList from '@/components/goals/GoalList';
import AddGoalButton from '@/components/goals/AddGoalButton'; // For triggering a modal/form

export const metadata = {
  title: 'My Goals',
};

// Define the structure of a goal
export type GoalStatus = 'not_started' | 'in_progress' | 'completed';
export type GoalType = 'personal' | 'academic' | 'professional' | 'other';

export interface UserGoal {
  id: string; // UUID
  user_id: string;
  title: string;
  description?: string | null;
  type: GoalType;
  status: GoalStatus;
  target_date?: string | null; // ISO date string
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

async function getUserGoals(supabase: any, userId: string): Promise<UserGoal[]> {
  const { data: goals, error } = await supabase
    .from('user_goals') // Your Supabase table name for user goals
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user goals:', error);
    return [];
  }
  return goals || [];
}

export default async function GoalsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login?message=Please log in to manage your goals.');
  }

  const userGoals = await getUserGoals(supabase, user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <h1 className="text-3xl font-bold text-neutral-text mb-4 sm:mb-0">
          My Goals
        </h1>
        {/* AddGoalButton will likely be a client component that opens a modal with GoalForm */}
        <AddGoalButton />
      </div>

      {userGoals.length > 0 ? (
        <GoalList initialGoals={userGoals} />
      ) : (
        <div className="text-center py-10 px-6 bg-white rounded-lg shadow">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-400 mx-auto mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Goals Yet!</h2>
          <p className="text-gray-500 mb-6">
            Ready to achieve great things? Add your first goal to get started.
          </p>
          {/* Simplified "Add Goal" for empty state, or rely on the AddGoalButton above */}
          {/* <AddGoalButton isPrimary={true} /> */}
        </div>
      )}
    </div>
  );
}