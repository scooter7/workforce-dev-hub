'use client'; // For handling user interactions like logout and router usage

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js'; // Type for the user object
import { supabase } from '@/lib/supabase/client'; // Client-side Supabase for signOut
import Button from '@/components/ui/Button';
// import Image from 'next/image'; // If you have a logo
// import UserProfileDropdown from './UserProfileDropdown'; // Optional: for a more complex user menu

export default function Navbar({ user }: { user: User | null }) {
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error.message);
      // Optionally display an error message to the user via a toast or alert
    }
    // After sign out, Supabase auth helper clears the session cookie.
    // router.refresh() will re-evaluate server components (like DashboardLayout)
    // which will then redirect to /login.
    // Or, directly push to login page for faster client-side redirect.
    router.push('/login?message=You have been logged out.');
    // router.refresh(); // Alternative to ensure server re-evaluates
  };

  // Access user's full name from metadata if available
  const userName = user?.user_metadata?.full_name || user?.email;

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / App Name */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-brand-primary hover:text-brand-primary-dark">
              {/* <Image src="/images/logo-sm.png" alt="Logo" width={32} height={32} /> */}
              Power Skills
            </Link>
          </div>

          {/* Navigation Links (Optional - can be in Sidebar too) */}
          {/* <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link href="/" className="text-gray-700 hover:text-brand-primary px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </Link>
              <Link href="/goals" className="text-gray-700 hover:text-brand-primary px-3 py-2 rounded-md text-sm font-medium">
                Goals
              </Link>
              <Link href="/profile" className="text-gray-700 hover:text-brand-primary px-3 py-2 rounded-md text-sm font-medium">
                Profile
              </Link>
            </div>
          </div> */}

          {/* Right side: User Info & Logout */}
          <div className="ml-auto flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 hidden sm:block">
                  Welcome, {userName}!
                </span>
                {/* Optional: UserProfileDropdown for more options
                <UserProfileDropdown user={user} onLogout={handleLogout} />
                */}
                <Button onClick={handleLogout} variant="ghost" size="sm">
                  Logout
                </Button>
              </div>
            ) : (
              // Fallback if user is somehow null but page is accessed (should be rare due to layout protection)
              <Link href="/login">
                <Button variant="primary" size="sm">Login</Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button (optional, if you have more nav links) */}
          {/* <div className="-mr-2 flex md:hidden">
            <button
              // onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className="bg-gray-100 inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-brand-primary hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-primary"
              aria-controls="mobile-menu"
              // aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed. Heroicon name: menu */}
              {/* <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg> */}
              {/* Icon when menu is open. Heroicon name: x */}
              {/* <svg className="hidden h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg> */}
            {/*</button>
          </div> */}

        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state (optional) */}
      {/* <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden`} id="mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link href="/" className="text-gray-700 hover:text-brand-primary block px-3 py-2 rounded-md text-base font-medium">
            Dashboard
          </Link>
          <Link href="/goals" className="text-gray-700 hover:text-brand-primary block px-3 py-2 rounded-md text-base font-medium">
            Goals
          </Link>
          <Link href="/profile" className="text-gray-700 hover:text-brand-primary block px-3 py-2 rounded-md text-base font-medium">
            Profile
          </Link>
        </div>
        {user && (
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-5">
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{userName}</div>
                <div className="text-sm font-medium text-gray-500">{user.email}</div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-primary hover:bg-gray-100"
              >
                Logout
              </Button>
            </div>
          </div>
        )}
      </div> */}
    </nav>
  );
}