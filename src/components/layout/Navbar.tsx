// src/components/layout/Navbar.tsx

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { useAuth } from '@/components/providers/AuthProvider';

export default function Navbar({
  toggleMobileMenu,
}: {
  toggleMobileMenu: () => void;
}) {
  const router = useRouter();
  const { user, profile } = useAuth();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error logging out:', error.message);
    router.push('/login?message=You have been logged out.');
  };

  const userName = profile?.full_name || user?.email;
  // This check is now aligned with the middleware and sidebar.
  const isAdmin = user?.id === process.env.NEXT_PUBLIC_ADMIN_USER_ID;

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ... (mobile hamburger and logo remain the same) */}
          
          <div className="ml-auto flex items-center space-x-4">
            {/* The admin button now appears based on the consistent admin check. */}
            {user && isAdmin && (
              // The link now correctly points to the analytics page to avoid the 404 error.
              <Link href="/admin/analytics">
                <Button variant="outline" size="sm">
                  Admin
                </Button>
              </Link>
            )}

            {user ? (
              <>
                <span className="text-sm text-gray-600 hidden sm:block">
                  Welcome, {userName}!
                </span>
                <Button onClick={handleLogout} variant="ghost" size="sm">
                  Logout
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button variant="primary" size="sm">
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}