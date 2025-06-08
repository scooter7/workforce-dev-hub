'use client';

import { useState, useEffect } from 'react';
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
  const [recentActivities, setRecentActivities] = useState<PointActivity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);


  useEffect(() => {
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

    fetchRecentActivities();
  }, []);


  return (
    <div className="max-w-3xl mx-auto">
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
    </div>
  );
}