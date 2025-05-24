'use client';

import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { usePathname } from 'next/navigation';
import {
  // HomeIcon, // Removed as it's no longer used
  ClipboardDocumentListIcon,
  UserCircleIcon,
  QuestionMarkCircleIcon,
  TrophyIcon,
  WrenchScrewdriverIcon,
  ChatBubbleLeftEllipsisIcon, // Used for "Explore and Chat"
} from '@heroicons/react/24/outline';

interface SidebarProps {
  user: User | null;
}

const commonIconClass = "h-6 w-6 mr-3 flex-shrink-0";

const navigationItems = [
  { name: 'Explore and Chat', href: '/', icon: ChatBubbleLeftEllipsisIcon },
  { name: 'My Goals', href: '/goals', icon: ClipboardDocumentListIcon },
  { name: 'Quizzes', href: '/quizzes', icon: QuestionMarkCircleIcon },
  { name: 'My Points', href: '/points', icon: TrophyIcon },
  { name: 'My Profile', href: '/profile', icon: UserCircleIcon },
];

const adminLinks = [
    { name: 'Ingest Documents', href: '/ingest', icon: WrenchScrewdriverIcon },
    { name: 'Create Quiz', href: '/quizzes/new', icon: WrenchScrewdriverIcon },
    // Example: { name: 'Manage Quizzes', href: '/admin/manage-quizzes', icon: WrenchScrewdriverIcon },
];

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const showAdminLinks = user && user.id === process.env.NEXT_PUBLIC_ADMIN_USER_ID;

  return (
    <aside className="w-64 bg-gradient-to-b from-brand-primary-dark to-brand-primary text-white flex flex-col shadow-lg print:hidden">
      <div className="h-16 flex items-center justify-center border-b border-brand-primary-medium flex-shrink-0 px-4">
        <Link href="/" className="text-xl font-semibold text-white hover:opacity-80 transition-opacity truncate">
          Workforce Hub
        </Link>
      </div>

      <nav className="flex-grow p-3 space-y-1.5 overflow-y-auto">
        {navigationItems.map((item) => {
          const isActiveBase = pathname === item.href;
          // Ensure root link '/' is only active for exact match, others can match start for nested routes
          const finalIsActive = item.href === '/' ? isExactlyRoot : (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)));
          const isExactlyRoot = item.href === '/' && pathname === '/'; // Re-calculate here for clarity

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center px-3 py-2.5 rounded-md text-sm font-medium
                transition-colors duration-150 group
                ${
                  (item.href === '/' ? isExactlyRoot : isActiveBase) // Corrected active logic here
                    ? 'bg-sky-700 text-white shadow-inner'
                    : 'text-blue-100 hover:bg-brand-primary-medium hover:text-white'
                }
              `}
            >
              <item.icon 
                className={`${commonIconClass} ${(item.href === '/' ? isExactlyRoot : isActiveBase) ? 'text-white' : 'text-blue-300 group-hover:text-white'}`} 
                aria-hidden="true" />
              {item.name}
            </Link>
          );
        })}

        {showAdminLinks && (
            <>
                <hr className="my-3 border-blue-500" />
                <div className="px-3 py-1 text-xs font-semibold text-blue-200 uppercase tracking-wider">Admin Tools</div>
                {adminLinks.map(adminItem => {
                    const isActive = pathname === adminItem.href;
                    return (
                         <Link
                            key={adminItem.name}
                            href={adminItem.href}
                            className={`
                                flex items-center px-3 py-2.5 rounded-md text-sm font-medium
                                transition-colors duration-150 group
                                ${
                                isActive
                                    ? 'bg-sky-700 text-white shadow-inner'
                                    : 'text-blue-100 hover:bg-brand-primary-medium hover:text-white'
                                }
                            `}
                            >
                            <adminItem.icon 
                                className={`${commonIconClass} ${isActive ? 'text-white' : 'text-blue-300 group-hover:text-white'}`} 
                                aria-hidden="true" />
                            {adminItem.name}
                        </Link>
                    );
                })}
             </>
        )}
      </nav>

      {user && (
        <div className="p-4 border-t border-brand-primary-medium mt-auto flex-shrink-0">
          <p className="text-xs text-blue-200">Logged in as:</p>
          <p className="text-sm font-medium truncate" title={user.email || ''}>
            {user.user_metadata?.full_name || user.email}
          </p>
        </div>
      )}
    </aside>
  );
}