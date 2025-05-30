// src/app/(dashboard)/layout.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import React from 'react';
// Remove Sidebar import as it's handled by RootLayout
// import Sidebar from '@/components/layout/Sidebar'; 
// import Header from '@/components/layout/Header'; // Keep if you have a dashboard-specific header

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    // This check might be redundant if your middleware already handles it,
    // but it's a good safeguard for the layout.
    console.log('No user session found in DashboardLayout, redirecting to login.');
    return redirect('/login?message=Please log in to access the dashboard.');
  }

  // The RootLayout (src/app/layout.tsx) already renders the Sidebar.
  // This DashboardLayout just provides the structure for the content area
  // to the right of the sidebar (on desktop) or above the bottom nav (on mobile).

  return (
    // This div takes the space provided by RootLayout's <main> tag for {children}
    // It's already inside a flex container from RootLayout.
    // We removed the outer "flex h-screen" from here because RootLayout handles the overall screen flex.
    <div className="flex flex-1 flex-col overflow-hidden"> {/* Main content area should handle its own scrolling */}
      {/* If you have a dashboard-specific Header that's different from a global one: */}
      {/* <Header /> */} 
      
      <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8">
        {children}
      </div>
    </div>
  );
}