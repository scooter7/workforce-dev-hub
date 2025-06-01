import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // <<< IMPORT Inter
import './globals.css';
import { Toaster } from 'sonner';
import SupabaseProvider from '@/components/providers/SupabaseProvider';
import AuthProvider from '@/components/providers/AuthProvider';
import Sidebar from '@/components/layout/Sidebar';

// Initialize the Inter font
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Ensures text is visible while font loads
  variable: '--font-inter', // Optional: if you want to use it as a CSS variable elsewhere
});

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
    <html lang="en" className={`${inter.variable} h-full font-sans`}> {/* Apply font variable and fallback */}
      <body className={`flex flex-col md:flex-row h-screen bg-neutral-bg antialiased`}> {/* Removed inter.className directly here as it's on html */}
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