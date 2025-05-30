// src/app/(dashboard)/layout.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
//import Header from '@/components/layout/Header'; // Assuming you might have a Header component
import React, { Suspense } from 'react';
// AuthProvider and SupabaseProvider are in the RootLayout (src/app/layout.tsx)

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.log('No user session found in DashboardLayout, redirecting to login.');
    return redirect('/login?message=Please log in to access the dashboard.');
  }

  // The Sidebar component will get the user via useAuth() hook,
  // so we don't need to pass it as a prop here.
  // AuthProvider in RootLayout makes this possible.

  return (
    <div className="flex h-screen bg-neutral-bg"> {/* Ensure full height for flex layout */}
      {/* Sidebar */}
      <Suspense fallback={<div className="w-60 lg:w-64 flex-shrink-0 bg-brand-primary p-4 text-white">Loading navigation...</div>}>
        <Sidebar /> {/* <<< REMOVED user={user} prop */}
      </Suspense>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden"> {/* Main content area should handle its own scrolling */}
        {/* Optional Header within the main content area */}
        {/* <Header user={user} /> */} 
        
        <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}