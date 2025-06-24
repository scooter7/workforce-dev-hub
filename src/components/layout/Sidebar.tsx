'use client';

import Link from 'next/link';
import Image from 'next/image'; // <<< Import the Image component
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  UserCircleIcon,
  QuestionMarkCircleIcon,
  TrophyIcon,
  WrenchScrewdriverIcon,
  ArrowRightOnRectangleIcon,
  DocumentPlusIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';

const iconSharedClass = "h-6 w-6";

const navigationItems = [
  { name: 'Explore', href: '/', icon: HomeIcon, exact: true },
  { name: 'Goals', href: '/goals', icon: ClipboardDocumentListIcon },
  { name: 'Learn', href: '/quizzes', icon: QuestionMarkCircleIcon },
  { name: 'Points', href: '/points', icon: TrophyIcon },
  { name: 'Profile', href: '/profile', icon: UserCircleIcon },
];

const adminBaseLinks = [
    { name: 'Ingest Documents', href: '/admin/ingest', icon: WrenchScrewdriverIcon },
];

const quizAdminSpecificLinks = [
    { name: 'Create New Quiz', href: '/admin/quizzes/new', icon: DocumentPlusIcon },
    { name: 'Bulk Upload Questions', href: '/admin/quizzes/bulk-upload', icon: ArrowUpTrayIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isAdmin, signOut } = useAuth();

  // console.log("[Sidebar] Auth State | User ID:", user ? user.id : 'No User', "| IsAdmin:", isAdmin); // Keep for debugging if needed

  const commonLinkClasses = "transition-colors duration-150 group flex items-center";
  const activeDesktopLink = "bg-sky-700 text-white shadow-inner";
  const inactiveDesktopLink = "text-blue-100 hover:bg-brand-primary-medium hover:text-white";
  const activeMobileLink = "text-brand-primary";
  const inactiveMobileLink = "text-gray-500 hover:text-brand-primary";

  const isLinkActive = (href: string, exact: boolean = false) => {
    if (exact) return pathname === href;
    if (href === '/admin' && pathname.startsWith('/admin')) return true;
    if (href === '/admin/quizzes' && pathname.startsWith('/admin/quizzes')) return true;
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-60 lg:w-64 bg-gradient-to-b from-brand-primary-dark to-brand-primary text-white  flex-col shadow-lg print:hidden">
        <div className="h-16 flex items-center justify-center border-b border-brand-primary-medium flex-shrink-0 px-4">
          <Link href="/" className="inline-block hover:opacity-80 transition-opacity" title="Power Skills Home">
            <Image
              src="/favicon.ico" // Path relative to the /public directory
              alt="Power Skills Logo"
              width={36} // Adjust size as needed (e.g., 32, 36, 40)
              height={36} // Keep it square or adjust to your favicon's aspect ratio
              priority // If it's a key visual element, consider priority
            />
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive = isLinkActive(item.href, item.exact);
            return (
              <Link
                key={`desktop-${item.name}`}
                href={item.href}
                className={`${commonLinkClasses} px-3 py-2.5 rounded-md text-sm font-medium ${isActive ? activeDesktopLink : inactiveDesktopLink}`}
              >
                <item.icon className={`${iconSharedClass} mr-3 ${isActive ? 'text-white' : 'text-blue-300 group-hover:text-white'}`} aria-hidden="true" />
                {item.name}
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <hr className="my-3 border-blue-500" />
              <div className="px-3 py-1 text-xs font-semibold text-blue-200 uppercase tracking-wider">Admin Tools</div>
              {adminBaseLinks.map(adminItem => {
                const isActive = isLinkActive(adminItem.href);
                return (
                  <Link
                    key={`desktop-admin-${adminItem.name}`}
                    href={adminItem.href}
                    className={`${commonLinkClasses} px-3 py-2.5 rounded-md text-sm font-medium ${isActive ? activeDesktopLink : inactiveDesktopLink}`}
                  >
                    <adminItem.icon className={`${iconSharedClass} mr-3 ${isActive ? 'text-white' : 'text-blue-300 group-hover:text-white'}`} aria-hidden="true" />
                    {adminItem.name}
                  </Link>
                );
              })}
              {quizAdminSpecificLinks.map(quizAdminItem => {
                const isActive = isLinkActive(quizAdminItem.href);
                return (
                  <Link
                    key={`desktop-quiz-admin-${quizAdminItem.name}`}
                    href={quizAdminItem.href}
                    className={`${commonLinkClasses} px-3 py-2.5 rounded-md text-sm font-medium ${isActive ? activeDesktopLink : inactiveDesktopLink}`}
                  >
                    <quizAdminItem.icon className={`${iconSharedClass} mr-3 ${isActive ? 'text-white' : 'text-blue-300 group-hover:text-white'}`} aria-hidden="true" />
                    {quizAdminItem.name}
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
            <button
              onClick={async () => {
                if (signOut) await signOut();
              }}
              className="mt-2 w-full text-left text-xs text-blue-200 hover:text-white flex items-center"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-1.5" />
              Logout
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-neutral-border shadow-top-md flex justify-around items-center z-40 print:hidden">
        {navigationItems.slice(0, isAdmin ? 3 : 4).map((item) => {
          const isActive = isLinkActive(item.href, item.exact);
          return (
            <Link
              key={`mobile-${item.name}`}
              href={item.href}
              className={`${commonLinkClasses} flex-col p-1.5 sm:p-2 rounded-md text-center w-1/5 ${isActive ? activeMobileLink : inactiveMobileLink}`}
              title={item.name}
            >
              <item.icon className={`${iconSharedClass} mb-0.5 mx-auto`} aria-hidden="true" />
              <span className="text-[10px] sm:text-xs leading-tight">{item.name}</span>
            </Link>
          );
        })}
        {isAdmin ? (
             <Link
                key="mobile-admin-tools"
                href="/admin/quizzes/new"
                className={`${commonLinkClasses} flex-col p-1.5 sm:p-2 rounded-md text-center w-1/5 ${pathname.startsWith('/admin') ? activeMobileLink : inactiveMobileLink}`}
                title="Admin Tools"
            >
                <WrenchScrewdriverIcon className={`${iconSharedClass} mb-0.5 mx-auto`} />
                <span className="text-[10px] sm:text-xs leading-tight">Admin</span>
            </Link>
        ) : (
             <Link
                key="mobile-profile"
                href="/profile"
                className={`${commonLinkClasses} flex-col p-1.5 sm:p-2 rounded-md text-center w-1/5 ${isLinkActive("/profile") ? activeMobileLink : inactiveMobileLink}`}
                title="Profile"
            >
                <UserCircleIcon className={`${iconSharedClass} mb-0.5 mx-auto`} />
                <span className="text-[10px] sm:text-xs leading-tight">Profile</span>
            </Link>
        )}
      </nav>
      <div className="md:hidden h-16 flex-shrink-0"></div>
    </>
  );
}