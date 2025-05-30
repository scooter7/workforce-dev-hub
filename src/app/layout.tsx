// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import SupabaseProvider from '@/components/providers/SupabaseProvider';
import AuthProvider from '@/components/providers/AuthProvider';
import Sidebar from '@/components/layout/Sidebar';

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
    <html lang="en" className="h-full"> {/* Ensure html has h-full */}
      <body className={`${inter.className} flex flex-col md:flex-row h-screen bg-neutral-bg antialiased`}> {/* h-screen for full viewport height */}
        <SupabaseProvider>
          <AuthProvider>
            <Sidebar /> 
            <main className="flex-grow flex flex-col overflow-y-auto"> {/* main is flex-col and scrolls */}
              {children} {/* children is DashboardLayout */}
            </main>
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}