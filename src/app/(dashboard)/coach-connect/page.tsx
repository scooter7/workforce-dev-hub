// src/app/(dashboard)/coach-connect/page.tsx
import { Metadata } from 'next';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CoachConnectForm from '@/components/coach/CoachConnectForm';

export const metadata: Metadata = {
  title: 'Coach Connect',
  description: 'Learn about LifeRamp Coaching and get connected with a coach.',
};

export default async function CoachConnectPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login?message=Please log in to connect with a coach.');
  }

  return (
    <div
      className="w-full min-h-full p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center"
      style={{
        backgroundImage: `url(https://liferamp360.com/wp-content/uploads/2023/03/Group-343.svg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="max-w-3xl w-full bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-8 text-center flex flex-col items-center">
        <h1 className="text-3xl font-bold text-neutral-text mb-2">Connect with a LifeRamp Coach</h1>
        <p className="text-gray-600 mb-8 max-w-xl">Answer a few questions to help us understand your needs, and we'll help find the perfect coach for you.</p>
        <CoachConnectForm />
      </div>
    </div>
  );
}