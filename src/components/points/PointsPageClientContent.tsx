'use client';

import { useState, useEffect, useMemo } from 'react';
import { UserProfileWithPoints } from '@/app/(dashboard)/points/page'; // Re-use type
import { InformationCircleIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

// Define PointActivity type here or import if defined globally
export interface PointActivity {
  id: string;
  reason_code: string; // Keep code for potential icons or specific formatting
  reason_message?: string | null; // Main display message
  reason?: string; // This will be populated with reason_message or formatted reason_code
  points_awarded: number;
  created_at: string;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
}


interface PointsPageClientContentProps {
  currentUserId: string;
  currentUserProfile: UserProfileWithPoints | null;
}

export default function PointsPageClientContent({
  currentUserId,
  currentUserProfile,
}: PointsPageClientContentProps) {
  const [leaderboard, setLeaderboard] = useState<UserProfileWithPoints[]>([]);
  const [recentActivities, setRecentActivities] = useState<PointActivity[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);


  useEffect(() => {
    async function fetchLeaderboard() {
      setIsLoadingLeaderboard(true);
      setLeaderboardError(null);
      try {
        const response = await fetch('/api/points/leaderboard');
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to fetch leaderboard');
        }
        const data: UserProfileWithPoints[] = await response.json();
        setLeaderboard(data);
      } catch (error: any) {
        console.error("Error fetching leaderboard:", error);
        setLeaderboard([]);
        setLeaderboardError(error.message);
      } finally {
        setIsLoadingLeaderboard(false);
      }
    }

    async function fetchRecentActivities() {
        setIsLoadingActivities(true);
        setActivitiesError(null);
        try {
          const response = await fetch('/api/points/log');
          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to fetch recent activities');
          }
          const data: PointActivity[] = await response.json();
          // The API already formats 'reason', so we can use it directly if preferred
          // Or, keep reason_code and reason_message separate for more structured display
          setRecentActivities(data);
        } catch (error: any) {
          console.error("Error fetching recent activities:", error);
          setRecentActivities([]);
          setActivitiesError(error.message);
        } finally {
          setIsLoadingActivities(false);
        }
    }

    fetchLeaderboard();
    fetchRecentActivities();
  }, []);


  const displayLeaderboard = useMemo(() => {
    let displayList = [...leaderboard];
    const foundCurrentUser = displayList.find(u => u.id === currentUserId);

    // More robustly integrate current user's profile if available
    if (currentUserProfile) {
        if (foundCurrentUser) {
            // Update if already in list
            displayList = displayList.map(u =>
                u.id === currentUserId
                ? { ...u, ...currentUserProfile, full_name: currentUserProfile.full_name || "You" }
                : u
            );
        } else {
            // Add if not in top N list (and then re-sort, though this might push someone else out of top N view)
            // displayList.push({ ...currentUserProfile, full_name: currentUserProfile.full_name || "You" });
            // For a simple top N list, we might not add them if they aren't in the fetched data.
            // A separate "Your Rank" display would be better if they are not in top N.
        }
    }
    return displayList.sort((a, b) => b.points - a.points);
  }, [leaderboard, currentUserId, currentUserProfile]);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      {/* Recent Point Activities */}
      <section>
        <h2 className="text-2xl font-semibold text-neutral-text mb-6">Recent Activity</h2>
        {isLoadingActivities && <div className="bg-white p-6 rounded-lg shadow-md text-center"><p className="animate-pulse">Loading activities...</p></div>}
        {activitiesError && <div className="bg-white p-6 rounded-lg shadow-md text-center text-red-500"><p>Error loading activities: {activitiesError}</p></div>}
        {!isLoadingActivities && !activitiesError && recentActivities.length > 0 && (
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-700">{activity.reason_message || activity.reason_code.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</p>
                  <p className="text-xs text-gray-500">{new Date(activity.created_at).toLocaleString()}</p>
                </div>
                <span className={`font-semibold text-lg ${activity.points_awarded >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {activity.points_awarded >= 0 ? '+' : ''}{activity.points_awarded}
                </span>
              </div>
            ))}
          </div>
        )}
        {!isLoadingActivities && !activitiesError && recentActivities.length === 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
            <InformationCircleIcon className="h-10 w-10 mx-auto mb-2 text-gray-400" />
            No recent point activity. <Link href="/" className="text-brand-primary hover:underline">Engage with content</Link> to earn points!
          </div>
        )}
      </section>

      {/* Leaderboard */}
      <section>
        <h2 className="text-2xl font-semibold text-neutral-text mb-6">Leaderboard</h2>
        {isLoadingLeaderboard && <div className="bg-white p-4 rounded-lg shadow-md text-center"><p className="animate-pulse">Loading leaderboard...</p></div>}
        {leaderboardError && <div className="bg-white p-6 rounded-lg shadow-md text-center text-red-500"><p>Error loading leaderboard: {leaderboardError}</p></div>}
        {!isLoadingLeaderboard && !leaderboardError && displayLeaderboard.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow-md">
            <ul className="space-y-3">
              {displayLeaderboard.slice(0, 5).map((entry, index) => ( // Show top N
                <li
                  key={entry.id}
                  className={`flex items-center justify-between p-3 rounded-md ${entry.id === currentUserId ? 'bg-brand-primary-light border-2 border-brand-primary' : 'bg-gray-50'}`}
                >
                  <div className="flex items-center min-w-0"> {/* Added min-w-0 for better truncation */}
                    <span className={`font-bold w-8 text-center flex-shrink-0 ${index < 3 ? 'text-yellow-600' : 'text-gray-600'}`}>#{index + 1}</span>
                    <span className={`ml-3 font-medium truncate ${entry.id === currentUserId ? 'text-brand-primary-dark' : 'text-gray-800'}`}>{entry.full_name || `User ${entry.id.substring(0,6)}`}</span>
                  </div>
                  <span className={`font-bold text-lg flex-shrink-0 ml-2 ${entry.id === currentUserId ? 'text-brand-primary-dark' : 'text-gray-700'}`}>{entry.points} pts</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {!isLoadingLeaderboard && !leaderboardError && displayLeaderboard.length === 0 && (
           <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
            <InformationCircleIcon className="h-10 w-10 mx-auto mb-2 text-gray-400" />
            Leaderboard data is currently unavailable or no users have points.
          </div>
        )}
      </section>
    </div>
  );
}