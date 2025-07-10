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
  // We no longer get signOut from the context.
  const { user, profile } = useAuth();

  // The logout logic is now handled directly in the component.
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login?message=You have been logged out.');
  };

  const userName = profile?.full_name || user?.email;
  const isAdmin = profile?.role === 'admin';

  return (
    <nav className="bg-white shadow-md sticky top-0 z-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="p-2 mr-2 md:hidden text-gray-700 hover:text-gray-900"
              aria-label="Toggle menu"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            <div className="flex-shrink-0">
              <Link
                href="/"
                className="text-2xl font-bold text-brand-primary hover:text-brand-primary-dark"
              >
                LifeRamp AI Concierge
              </Link>
            </div>
          </div>

          <div className="ml-auto flex items-center space-x-4">
            {user && isAdmin && (
              <Link href="/admin/ingest">
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
                {/* This button now calls the local handleLogout function. */}
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