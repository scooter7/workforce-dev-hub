import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { SupabaseProvider } from '@/components/providers/SupabaseProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'LifeRamp',
  description: 'Your personal and professional development platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900`}>
        <SupabaseProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </SupabaseProvider>
        <Toaster richColors />
      </body>
    </html>
  );
}
