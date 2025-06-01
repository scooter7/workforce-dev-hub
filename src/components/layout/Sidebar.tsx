'use client';

import Link from 'next/link';
// User type import was removed as it's not directly used here anymore
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider'; 
import {
  ChatBubbleLeftEllipsisIcon,
  ClipboardDocumentListIcon,
  UserCircleIcon,
  QuestionMarkCircleIcon,
  TrophyIcon,
  WrenchScrewdriverIcon, // For general admin tools or specific quiz admin
  ArrowRightOnRectangleIcon,
  DocumentPlusIcon,      // For "Create Quiz" or "Add New"
  ArrowUpTrayIcon,       // For "Bulk Upload"
  //CogIcon,               // Example for "Manage Quizzes"
} from '@heroicons/react/24/outline'; 

const iconSharedClass = "h-6 w-6"; 

const navigationItems = [
  { name: 'Explore', href: '/', icon: ChatBubbleLeftEllipsisIcon, exact: true },
  { name: 'Goals', href: '/goals', icon: ClipboardDocumentListIcon },
  { name: 'Quizzes', href: '/quizzes', icon: QuestionMarkCircleIcon },
  { name: 'Points', href: '/points', icon: TrophyIcon },
  { name: 'Profile', href: '/profile', icon: UserCircleIcon },
];

// Updated Admin links, assuming your admin paths are prefixed with /admin/
const adminToolLinks = [
    { name: 'Ingest Documents', href: '/admin/ingest', icon: WrenchScrewdriverIcon },
];

const quizAdminLinks = [
    { name: 'Create New Quiz', href: '/admin/quizzes/new', icon: DocumentPlusIcon },
    { name: 'Bulk Upload Questions', href: '/admin/quizzes/bulk-upload', icon: ArrowUpTrayIcon },
    // Future: { name: 'Manage All Quizzes', href: '/admin/quizzes/manage-list', icon: CogIcon }, 
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isAdmin, signOut } = useAuth(); 

  const commonLinkClasses = "transition-colors duration-150 group flex items-center";
  const activeDesktopLink = "bg-sky-700 text-white shadow-inner";
  const inactiveDesktopLink = "text-blue-100 hover:bg-brand-primary-medium hover:text-white";
  const activeMobileLink = "text-brand-primary";
  const inactiveMobileLink = "text-gray-500 hover:text-brand-primary";

  const isLinkActive = (href: string, exact: boolean = false) => {
    if (exact) {
      return pathname === href;
    }
    // For admin parent paths, make them active if any child is active
    if (href === '/admin/quizzes' && pathname.startsWith('/admin/quizzes')) {
        return true;
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-60 lg:w-64 bg-gradient-to-b from-brand-primary-dark to-brand-primary text-white  flex-col shadow-lg print:hidden">
        <div className="h-16 flex items-center justify-center border-b border-brand-primary-medium flex-shrink-0 px-4">
          <Link href="/" className="text-xl font-semibold text-white hover:opacity-80 transition-opacity truncate">
            Workforce Hub
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
              {adminToolLinks.map(adminItem => {
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
              <div className="px-3 py-1 mt-2 text-xs font-semibold text-blue-200 uppercase tracking-wider">Quiz Admin</div>
              {quizAdminLinks.map(quizAdminItem => {
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
              onClick={signOut} 
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
        {navigationItems.slice(0, 4).map((item) => { // Show 4 main items
          const isActive = isLinkActive(item.href, item.exact);
          return (
            <Link
              key={`mobile-${item.name}`}
              href={item.href}
              className={`${commonLinkClasses} flex-col p-2 rounded-md ${isActive ? activeMobileLink : inactiveMobileLink}`}
              title={item.name}
            >
              <item.icon className={`${iconSharedClass} mb-0.5`} aria-hidden="true" />
              <span className="text-xs">{item.name}</span>
            </Link>
          );
        })}
        {/* "More" tab for Profile and Admin Links on Mobile */}
        <Link
            key="mobile-more"
            href={isAdmin ? "/admin/quizzes/new" : "/profile"} // Example: Admin goes to quiz creation, user to profile
            className={`${commonLinkClasses} flex-col p-2 rounded-md ${isLinkActive(isAdmin ? "/admin" : "/profile") ? activeMobileLink : inactiveMobileLink}`}
            title={isAdmin ? "Admin Tools" : "Profile"}
        >
            {isAdmin ? <WrenchScrewdriverIcon className={`${iconSharedClass} mb-0.5`} /> : <UserCircleIcon className={`${iconSharedClass} mb-0.5`} />}
            <span className="text-xs">{isAdmin ? "Admin" : "Profile"}</span>
        </Link>
      </nav>
      {/* Spacer for bottom nav on mobile */}
      <div className="md:hidden h-16 flex-shrink-0"></div>
    </>
  );
}