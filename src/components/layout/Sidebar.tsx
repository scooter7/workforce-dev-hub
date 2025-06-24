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

// ... (interface definitions remain the same)

const navItems: NavItem[] = [
  // ... (dashboard nav items remain the same)
];

const adminNavItems: NavItem[] = [
  // ... (admin nav items remain the same)
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth(); // Only need the user object here

  // The isAdmin check is now consistent with the rest of the application.
  const isAdmin = user?.id === process.env.NEXT_PUBLIC_ADMIN_USER_ID;

  const isUserSection = navItems.some(item => pathname.startsWith(item.href));

  return (
    <div className="bg-gray-800 text-white w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform -translate-x-full md:relative md:translate-x-0 transition duration-200 ease-in-out">
      <nav>
        {isUserSection &&
          navItems.map(item => (
            <Link
              key={item.name}
              href={item.href}
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

        {isAdmin &&
          adminNavItems.map(item => (
            <Link
              key={item.name}
              href={item.href}
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