// src/app/(dashboard)/layout.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import React from 'react'; // Suspense was removed as per previous build fix

// Sidebar is rendered by RootLayout

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

  return (
    // This div needs to allow its child (the page) to take full height if needed
    <div className="flex flex-col flex-1 min-h-0"> {/* flex-1 and min-h-0 for proper growth in flex parent */}
      {/* Optional Header could go here */}
      {/* <Header /> */}
      
      {/* The page content itself will often handle its own padding and internal scrolling if complex */}
      {/* Adding p-0 here and letting pages define their own top-level padding/scrolling */}
      <div className="flex-1 p-0"> 
        {children}
      </div>
    </div>
  );
}