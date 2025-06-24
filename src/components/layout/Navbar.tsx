'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { LogOut, Menu as MenuIcon } from 'lucide-react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr'; // Corrected Supabase import
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Navbar({ toggleMobileMenu }: { toggleMobileMenu: () => void }) {
  const { user, profile } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    // Note: It's better to create the client once, perhaps in a context or a singleton module
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.push('/login');
  };

  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

  return (
    <header className="relative z-20 flex-shrink-0 flex h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <button
        type="button"
        className="px-4 border-r border-gray-200 dark:border-gray-700 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
        onClick={toggleMobileMenu}
      >
        <span className="sr-only">Open sidebar</span>
        <MenuIcon className="h-6 w-6" aria-hidden="true" />
      </button>
      <div className="flex-1 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center md:hidden">
            <Link href="/">
                <Image src="/logo.png" alt="LifeRamp" width={120} height={32} />
            </Link>
        </div>
        <div className="flex-1 flex justify-end items-center">
            <div className="flex items-center space-x-4">
                <span className="text-gray-700 dark:text-gray-200 hidden sm:inline">
                Welcome, {profile?.full_name || user?.email}
                </span>
                <Link href="/profile">
                <span className="cursor-pointer">
                    {avatarUrl ? (
                        <img className="h-8 w-8 rounded-full" src={avatarUrl} alt="" />
                    ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-300" />
                    )}
                </span>
                </Link>
                <button
                    onClick={handleSignOut}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    title="Sign Out"
                >
                    <LogOut className="h-6 w-6" />
                </button>
            </div>
        </div>
      </div>
    </header>
  );
}
