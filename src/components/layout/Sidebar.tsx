// src/components/layout/Sidebar.tsx

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChartBarIcon,
  BookOpenIcon,
  CircleStackIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  DocumentArrowUpIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/components/providers/AuthProvider';
import type { Dispatch, SetStateAction } from 'react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface SidebarProps {
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: Dispatch<SetStateAction<boolean>>;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: ChartBarIcon },
  { name: 'Learning Path', href: '/goals', icon: BookOpenIcon },
  { name: 'Quizzes', href: '/quizzes', icon: CircleStackIcon },
  { name: 'Points', href: '/points', icon: Cog6ToothIcon },
  { name: 'Chat', href: '/chat', icon: ChatBubbleLeftRightIcon },
  { name: 'Profile', href: '/profile', icon: UserGroupIcon },
];

const adminNavItems: NavItem[] = [
  { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
  { name: 'Quizzes', href: '/admin/quizzes', icon: CircleStackIcon },
  { name: 'Ingest', href: '/admin/ingest', icon: DocumentArrowUpIcon },
];

export default function Sidebar({ isMobileMenuOpen, setMobileMenuOpen }: SidebarProps) {
  const pathname = usePathname();
  // The unused 'user' variable has been removed from this line.
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  let isUserSection = navItems.some(item => pathname.startsWith(item.href) && item.href !== '/');
  if (pathname === '/') {
    isUserSection = true;
  }

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div
      className={`bg-gray-800 text-white w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform md:relative md:translate-x-0 transition-transform duration-200 ease-in-out z-30 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <nav>
        {(isUserSection || pathname.startsWith('/admin')) &&
          navItems.map(item => (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleLinkClick}
              className={`flex items-center space-x-3 p-3 rounded-md transition-colors ${
                pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <item.icon className="h-6 w-6" />
              <span>{item.name}</span>
            </Link>
          ))}

        {isAdmin &&
          adminNavItems.map(item => (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleLinkClick}
              className={`flex items-center space-x-3 p-3 rounded-md transition-colors ${
                pathname.startsWith(item.href)
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <item.icon className="h-6 w-6" />
              <span>{item.name}</span>
            </Link>
          ))}
      </nav>
    </div>
  );
}