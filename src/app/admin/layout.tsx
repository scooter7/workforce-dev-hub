import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Navbar from '@/components/layout/Navbar'; // Re-use existing Navbar or create an AdminNavbar
import Link from 'next/link';

// Rudimentary admin check - REPLACE THIS WITH A PROPER ROLE SYSTEM
const ADMIN_USER_ID = process.env.ADMIN_USER_ID; // Set this in your .env.local

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login?message=Please log in.');
  }

  // Basic admin check - replace with a robust role-based system in a real app!
  if (!ADMIN_USER_ID || user.id !== ADMIN_USER_ID) {
    // return redirect('/?message=Access denied. Admin area only.');
    // For now, let's just show a message if not admin, rather than full redirect for easier testing.
    // In production, you'd absolutely redirect or show a 403/404.
    console.warn(`Admin access attempt by non-admin user: ${user.id}`);
    return (
        <div className="flex flex-col min-h-screen">
            {/* @ts-ignore Server Component */}
            <Navbar user={user} />
            <main className="flex-grow container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                <p className="mt-2">This area is restricted to administrators.</p>
                <Link href="/" className="text-blue-500 hover:underline mt-4 inline-block">
                    &larr; Back to Dashboard
                </Link>
            </main>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* You might want a specific Admin Navbar or reuse the existing one */}
      {/* @ts-ignore Server Component */}
      <Navbar user={user} />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-4 p-2 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
            <p className="font-bold">Admin Area</p>
            <p>You are currently in the admin section.</p>
        </div>
        {children}
      </main>
    </div>
  );
}