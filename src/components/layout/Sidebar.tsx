'use client';

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

interface SidebarProps {
    user: User | null;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = user?.app_metadata?.is_admin || false;

  return (
    // Use the new custom background color
    <aside className="hidden md:flex flex-col w-64 bg-sidebar-bg text-white">
      <div className="flex items-center justify-center h-20 border-b border-white/10">
        <Link href="/" passHref>
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
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        {mainNavLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.text}
              href={link.href}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-brand-primary-dark text-white' // Use a theme color for active state
                  : 'text-gray-300 hover:bg-brand-primary-dark/50 hover:text-white' // And for hover
              }`}
            >
              <link.icon className="h-6 w-6 mr-3" />
              {link.text}
            </Link>
          );
        })}

        {isAdmin && (
            <div className="pt-4 mt-4 space-y-2 border-t border-white/10">
                 <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</h3>
                {adminNavLinks.map(link => {
                    const isActive = pathname.startsWith(link.href);
                    return (
                        <Link key={link.text} href={link.href} className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                            isActive
                              ? 'bg-brand-primary-dark text-white'
                              : 'text-gray-300 hover:bg-brand-primary-dark/50 hover:text-white'
                          }`}>
                            <link.icon className="h-6 w-6 mr-3" />
                            {link.text}
                        </Link>
                    )
                })}
            </div>
        )}
      </nav>
    </aside>
  );
}