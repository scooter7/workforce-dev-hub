'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import type { Dispatch, SetStateAction } from 'react';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  UserCircleIcon,
  TrophyIcon,
  WrenchScrewdriverIcon,
  DocumentPlusIcon,
  ArrowUpTrayIcon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase/client';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
}

interface SidebarProps {
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: Dispatch<SetStateAction<boolean>>;
}

const navigationItems: NavItem[] = [
  { name: 'Explore', href: '/', icon: HomeIcon, exact: true },
  { name: 'Goals', href: '/goals', icon: ClipboardDocumentListIcon },
  { name: 'Learn', href: '/quizzes', icon: AcademicCapIcon },
  { name: 'Points', href: '/points', icon: TrophyIcon },
  { name: 'Coach Connect', href: '/coach-connect', icon: UserGroupIcon },
  { name: 'Profile', href: '/profile', icon: UserCircleIcon },
];

const adminBaseLinks: NavItem[] = [
  { name: 'Ingest Documents', href: '/admin/ingest', icon: WrenchScrewdriverIcon },
  { name: 'Analytics', href: '/admin/analytics', icon: HomeIcon },
  { name: 'Manage Quizzes', href: '/admin/quizzes', icon: ClipboardDocumentListIcon },
];

const quizAdminSpecificLinks: NavItem[] = [
  { name: 'Create New Quiz', href: '/admin/quizzes/new', icon: DocumentPlusIcon },
  { name: 'Bulk Upload Questions', href: '/admin/quizzes/bulk-upload', icon: ArrowUpTrayIcon },
];

export default function Sidebar({ isMobileMenuOpen, setMobileMenuOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const iconSharedClass = "h-6 w-6";
  const commonLinkClasses = "transition-colors duration-150 group flex items-center";
  const activeLinkStyle = "bg-sky-700 text-white shadow-inner";
  const inactiveLinkStyle = "text-blue-100 hover:bg-brand-primary-medium hover:text-white";

  const isLinkActive = (href: string, exact: boolean = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login?message=You have been logged out.');
  };

  const renderLink = (item: NavItem) => {
    const isActive = isLinkActive(item.href, item.exact);
    return (
      <Link
        key={item.name}
        href={item.href}
        onClick={handleLinkClick}
        className={`${commonLinkClasses} px-3 py-2.5 rounded-md text-sm font-medium ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
      >
        <item.icon className={`${iconSharedClass} mr-3 ${isActive ? 'text-white' : 'text-blue-300 group-hover:text-white'}`} aria-hidden="true" />
        {item.name}
      </Link>
    );
  };

  return (
    <div
      className={`bg-sidebar-bg text-white w-64 space-y-2 py-4 px-2 absolute inset-y-0 left-0 transform md:relative md:translate-x-0 transition-transform duration-200 ease-in-out z-30 flex flex-col print:hidden ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="h-16 flex items-center justify-center border-b border-brand-primary-medium flex-shrink-0 px-4">
        <Link href="/" className="inline-block hover:opacity-80 transition-opacity" title="LifeRamp Home">
          <Image
            src="/favicon.ico"
            alt="LifeRamp Logo"
            width={128}
            height={128}
            priority
          />
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {isAdmin && pathname.startsWith('/admin') ? (
          <>
            <div className="px-3 py-1 text-xs font-semibold text-blue-200 uppercase tracking-wider">Admin Tools</div>
            {adminBaseLinks.map(renderLink)}
            {quizAdminSpecificLinks.map(renderLink)}
          </>
        ) : (
          <>
            {navigationItems.map(renderLink)}
          </>
        )}
      </nav>

      {user && (
        <div className="p-4 border-t border-brand-primary-medium mt-auto flex-shrink-0">
          <p className="text-xs text-blue-200">Logged in as:</p>
          <p className="text-sm font-medium truncate" title={user.email || ''}>
            {profile?.full_name || user.email}
          </p>
          <button
            onClick={handleLogout}
            className="mt-2 w-full text-left text-xs text-blue-200 hover:text-white flex items-center"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4 mr-1.5" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}