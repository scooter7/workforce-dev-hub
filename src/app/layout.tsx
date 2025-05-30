import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner'; // For toast notifications
import AuthProvider from '@/components/providers/AuthProvider';
import Sidebar from '@/components/layout/Sidebar'; // We'll make this responsive
import SupabaseProvider from '@/components/providers/SupabaseProvider'; // If you created this

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Workforce Development Hub',
    template: '%s | Workforce Hub',
  },
  description: 'Your platform for professional growth, AI chat, and goal tracking.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} flex flex-col md:flex-row h-full bg-neutral-bg`}>
        <SupabaseProvider> {/* If you have this provider for client Supabase context */}
          <AuthProvider> {/* Handles fetching user for Sidebar and client components */}
            {/* Sidebar will handle its own responsive display (sidebar on desktop, bottom bar on mobile) */}
            <Sidebar /> 
            
            <main className="flex-grow overflow-y-auto"> 
              {/* On mobile, this main content will be above the fixed bottom bar */}
              {/* On desktop, it will be to the right of the sidebar */}
              {children}
            </main>
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}