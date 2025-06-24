'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Trophy, Target, User, LifeBuoy, BarChart, X } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import Image from 'next/image';

const navItems = [
  { href: '/', icon: Compass, label: 'Explore' },
  { href: '/quizzes', icon: LifeBuoy, label: 'Learn' },
  { href: '/goals', icon: Target, label: 'Goals' },
  { href: '/points', icon: Trophy, label: 'Points' },
  { href: '/profile', icon: User, label: 'Profile' },
];

const adminNavItems = [
    { href: '/admin/analytics', icon: BarChart, label: 'Analytics' },
    // Add other admin links here
];

export default function Sidebar({ isMobileMenuOpen, setMobileMenuOpen }: { isMobileMenuOpen: boolean, setMobileMenuOpen: (open: boolean) => void }) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const NavLinks = ({ inMobileMenu = false }: { inMobileMenu?: boolean }) => (
    <nav className="flex-1 px-2 space-y-1">
      {(isAdmin ? [...navItems, ...adminNavItems] : navItems).map((item) => (
        <Link
          key={item.label}
          href={item.href}
          onClick={inMobileMenu ? closeMobileMenu : undefined}
          className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
            pathname === item.href
              ? 'bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <item.icon className={`mr-3 flex-shrink-0 h-6 w-6 ${
            pathname === item.href ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
          }`} aria-hidden="true" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
  
  const menuContent = (
    <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <Link href="/" onClick={closeMobileMenu}>
            <Image src="/logo.png" alt="LifeRamp" width={150} height={40} />
          </Link>
        </div>
        <div className="mt-5 flex-grow flex flex-col">
            <NavLinks inMobileMenu={isMobileMenuOpen} />
        </div>
    </div>
  );

  return (
    <>
      {/* --- Desktop sidebar --- */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-full border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            {menuContent}
          </div>
        </div>
      </div>

      {/* --- Mobile menu --- */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 flex z-40">
            {/* Off-canvas menu */}
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800">
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                    type="button"
                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={() => setMobileMenuOpen(false)}
                    >
                    <span className="sr-only">Close sidebar</span>
                    <X className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                </div>
                {menuContent}
            </div>

            {/* Overlay to close menu on click */}
            <div className="flex-shrink-0 w-14" aria-hidden="true" onClick={() => setMobileMenuOpen(false)}></div>
        </div>
      )}
    </>
  );
}
