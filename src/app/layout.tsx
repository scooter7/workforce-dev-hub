// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner'; // For toast notifications
import SupabaseProvider from '@/components/providers/SupabaseProvider'; // Ensure path is correct
import AuthProvider from '@/components/providers/AuthProvider';     // Ensure path is correct
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
    <html lang="en" className="h-full">
      <body className={`${inter.className} flex flex-col md:flex-row h-full bg-neutral-bg`}>
        <SupabaseProvider>
          <AuthProvider>
            {/* Sidebar now uses useAuth, so it needs to be within AuthProvider */}
            <Sidebar /> 
            
            <main className="flex-grow overflow-y-auto"> 
              {children}
            </main>
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}