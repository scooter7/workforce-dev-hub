// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import SupabaseProvider from '@/components/providers/SupabaseProvider';
import AuthProvider from '@/components/providers/AuthProvider';
import Sidebar from '@/components/layout/Sidebar';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      {/* The fix is restoring 'flex-col md:flex-row' to the body tag */}
      <body className={`${inter.className} flex flex-col md:flex-row h-screen bg-neutral-bg antialiased`}>
        <SupabaseProvider>
          <AuthProvider>
            <Sidebar />
            <main className="flex-grow flex flex-col overflow-y-auto">
              {children}
            </main>
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}