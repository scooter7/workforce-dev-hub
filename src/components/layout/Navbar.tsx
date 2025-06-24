'use client'; // For handling user interactions like logout and router usage

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js'; // Type for the user object
import { supabase } from '@/lib/supabase/client'; // Client-side Supabase for signOut
import Button from '@/components/ui/Button';

export default function Navbar({ user }: { user: User | null }) {
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error.message);
    }
    router.push('/login?message=You have been logged out.');
  };

  const userName = user?.user_metadata?.full_name || user?.email;

  // Now checking against your NEXT_PUBLIC_ADMIN_USER_ID
  const isAdmin = user?.id === process.env.NEXT_PUBLIC_ADMIN_USER_ID;

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo / App Name */}
          <div className="flex-shrink-0">
            <Link
              href="/"
              className="text-2xl font-bold text-brand-primary hover:text-brand-primary-dark"
            >
              Power Skills
            </Link>
          </div>

          {/* Right side: optional Admin link, User Info & Logout */}
          <div className="ml-auto flex items-center space-x-4">
            {user && isAdmin && (
              <Link href="/admin">
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
