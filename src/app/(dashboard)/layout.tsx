import { ReactNode, Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar'; // Ensure this import is correct

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login?message=Please log in to access this page.');
  }

  // User is authenticated, render the dashboard layout
  return (
    <div className="flex h-screen bg-neutral-bg overflow-hidden"> {/* Added overflow-hidden to parent */}
      {/* Sidebar */}
      <Suspense fallback={<div className="w-64 flex-shrink-0 bg-brand-primary p-4 text-white">Loading navigation...</div>}>
        <Sidebar user={user} />
      </Suspense>

      <div className="flex flex-1 flex-col overflow-hidden"> {/* Main content area should handle its own scrolling */}
        {/* Navbar */}
        <Suspense fallback={<div className="bg-white shadow p-4 text-center h-16 flex-shrink-0">Loading header...</div>}>
          <Navbar user={user} />
        </Suspense>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}