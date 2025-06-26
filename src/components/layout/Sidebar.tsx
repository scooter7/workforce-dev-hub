'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  BookOpenIcon,
  AcademicCapIcon,
  TrophyIcon,
  UserCircleIcon,
  CogIcon,
  ShieldCheckIcon,
  LightBulbIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';
import { workforceTopics } from '@/lib/constants';

const mainNavLinks = [
  { href: '/', icon: HomeIcon, text: 'Home' },
  { href: '/quizzes', icon: BookOpenIcon, text: 'Quizzes' },
  { href: `/chat/${workforceTopics[0].id}`, icon: LightBulbIcon, text: 'Learn' },
  { href: '/goals', icon: CheckCircleIcon, text: 'Goals' },
  { href: '/points', icon: TrophyIcon, text: 'Points' },
  { href: '/profile', icon: UserCircleIcon, text: 'Profile' },
];

const adminNavLinks = [
  { href: '/admin/analytics', icon: CogIcon, text: 'Analytics' },
  { href: '/admin/quizzes', icon: ShieldCheckIcon, text: 'Manage Quizzes' },
  { href: '/admin/ingest', icon: AcademicCapIcon, text: 'Manage Content' },
];

// Define the props interface to include mobile menu state handlers
interface SidebarProps {
  user: User | null;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

// Main Sidebar Component
export default function Sidebar({ user, isMobileMenuOpen, setMobileMenuOpen }: SidebarProps) {
  const isAdmin = user?.app_metadata?.is_admin || false;

  const handleLinkClick = () => {
    setMobileMenuOpen(false); // Close mobile menu on navigation
  };

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between h-20 px-4 border-b border-white/10">
        <Link href="/" passHref onClick={handleLinkClick}>
          <div className="flex items-center space-x-2">
            <Image 
              src="https://d3v0px0pttie1i.cloudfront.net/uploads/user/logo/25835639/39054a25.png"
              alt="Logo"
              width={40}
              height={40}
            />
            <span className="text-xl font-bold">Dev Hub</span>
          </div>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden p-1 text-gray-300 hover:text-white"
          aria-label="Close menu"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        {mainNavLinks.map((link) => (
          <SidebarLink key={link.text} link={link} onClick={handleLinkClick} />
        ))}
        
        {isAdmin && (
          <div className="pt-4 mt-4 space-y-2 border-t border-white/10">
            <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</h3>
            {adminNavLinks.map(link => (
              <SidebarLink key={link.text} link={link} onClick={handleLinkClick} />
            ))}
          </div>
        )}
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-sidebar-bg text-white">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Sidebar Panel */}
          <aside className="relative flex flex-col w-64 bg-sidebar-bg text-white">
            {sidebarContent}
          </aside>
          {/* Overlay */}
          <div onClick={() => setMobileMenuOpen(false)} className="flex-1 bg-black/50" aria-hidden="true"></div>
        </div>
      )}
    </>
  );
}

// Helper component for sidebar links
function SidebarLink({ link, onClick }: { link: typeof mainNavLinks[0], onClick: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));

  return (
    <Link
      href={link.href}
      onClick={onClick}
      className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        isActive
          ? 'bg-brand-primary-dark text-white'
          : 'text-gray-300 hover:bg-brand-primary-dark/50 hover:text-white'
      }`}
    >
      <link.icon className="h-6 w-6 mr-3" />
      {link.text}
    </Link>
  );
}