'use client';

import { useState, useEffect } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

// Existing interface for point logs
export interface PointActivity {
  id: string;
  reason_code: string;
  reason_message?: string | null;
  reason?: string;
  points_awarded: number;
  created_at: string;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
}

// New interface for our quiz history
export interface QuizAttemptHistory {
  id: string;
  title: string;
  score: number | null;
  total_questions: number | null;
  completed_at: string;
}

export default function PointsPageClientContent() {
  // --- Existing State ---
  const [recentActivities, setRecentActivities] = useState<PointActivity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  // --- New State for Quiz Attempts ---
  const [quizAttempts, setQuizAttempts] = useState<QuizAttemptHistory[]>([]);
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(true);
  const [attemptsError, setAttemptsError] = useState<string | null>(null);

  // --- Existing useEffect for Activities ---
  useEffect(() => {
    async function fetchRecentActivities() {
      setIsLoadingActivities(true);
      setActivitiesError(null);
      try {
        const response = await fetch('/api/points/log'); // Using the more specific log endpoint
        if (!response.ok) {
          throw new Error('Failed to fetch recent activities');
        }
        const data = await response.json();
        setRecentActivities(data);
      } catch (error: any) {
        setActivitiesError(error.message);
      } finally {
        setIsLoadingActivities(false);
      }
    }
    fetchRecentActivities();
  }, []);

  // --- New useEffect for Quiz Attempts ---
  useEffect(() => {
    async function fetchQuizAttempts() {
      setIsLoadingAttempts(true);
      setAttemptsError(null);
      try {
        const response = await fetch('/api/quiz-attempts'); // Fetch from our new endpoint
        if (!response.ok) {
          throw new Error('Failed to fetch quiz history');
        }
        const data = await response.json();
        setQuizAttempts(data);
      } catch (error: any) {
        setAttemptsError(error.message);
      } finally {
        setIsLoadingAttempts(false);
      }
    }
    fetchQuizAttempts();
  }, []);


  return (
    <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
      {/* Quiz History Section */}
      <section>
        <h2 className="text-2xl font-semibold text-neutral-text mb-6">
          Quiz History
        </h2>
        {isLoadingAttempts && (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <p className="animate-pulse">Loading quiz history...</p>
          </div>
        )}
        {attemptsError && (
          <div className="bg-white p-6 rounded-lg shadow-md text-center text-red-500">
            <p>Error: {attemptsError}</p>
          </div>
        )}
        {!isLoadingAttempts && !attemptsError && quizAttempts.length > 0 && (
          <div className="space-y-4">
            {quizAttempts.map((attempt) => (
              <div key={attempt.id} className="bg-white p-4 rounded-lg shadow-md">
                <div className="flex justify-between items-start">
                  <div className="flex-grow">
                    <p className="font-medium text-gray-700">{attempt.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(attempt.completed_at).toLocaleString()}
                    </p>
                  </div>
                  <span className="font-semibold text-lg text-brand-primary-dark ml-4 whitespace-nowrap">
                    {attempt.score ?? 'N/A'} / {attempt.total_questions ?? 'N/A'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        {!isLoadingAttempts && !attemptsError && quizAttempts.length === 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
            <InformationCircleIcon className="h-10 w-10 mx-auto mb-2 text-gray-400" />
            You haven't completed any quizzes yet.{' '}
            <Link href="/quizzes" className="text-brand-primary hover:underline">
              Test your knowledge
            </Link>!
          </div>
        )}
      </section>

      {/* Recent Point Activity Section */}
      <section>
        <h2 className="text-2xl font-semibold text-neutral-text mb-6">
          Recent Activity
        </h2>
        {isLoadingActivities && (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <p className="animate-pulse">Loading activities...</p>
          </div>
        )}
        {activitiesError && (
          <div className="bg-white p-6 rounded-lg shadow-md text-center text-red-500">
            <p>Error: {activitiesError}</p>
          </div>
        )}
        {!isLoadingActivities && !activitiesError && recentActivities.length > 0 && (
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-gray-700 capitalize">
                    {activity.reason_message || activity.reason_code.replace(/_/g, ' ').toLowerCase()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.created_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`font-semibold text-lg ${
                    activity.points_awarded >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {activity.points_awarded >= 0 ? '+' : ''}
                  {activity.points_awarded}
                </span>
              </div>
            ))}
          </div>
        )}
        {!isLoadingActivities && !activitiesError && recentActivities.length === 0 && (
           <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
             <InformationCircleIcon className="h-10 w-10 mx-auto mb-2 text-gray-400" />
             No recent point activity to show.
           </div>
        )}
      </section>
    </div>
  );
}