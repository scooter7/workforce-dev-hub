import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Example font, you can change this
import './globals.css'; // Your global styles

// Optional: If you want to provide Supabase context to client components easily
// import AuthProvider from '@/contexts/AuthProvider'; // We'll define this later

// Example: Using Next/Font for optimized font loading
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'Workforce Development Hub',
    template: '%s | Workforce Hub', // For page-specific titles
  },
  description: 'Your platform for professional growth, AI chat, and goal tracking.',
  // Add more metadata like icons, open graph images, etc.
  // icons: {
  //   icon: '/favicon.ico', // Make sure favicon.ico is in public folder
  //   apple: '/apple-touch-icon.png', // Example
  // },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <head>
        {/* Standard head elements like charSet, viewport are handled by Next.js by default.
            You can add other custom tags here if needed, e.g., for analytics scripts, custom fonts not via next/font */}
      </head>
      <body className="flex min-h-screen flex-col antialiased">
        {/*
          Optional: Wrap with an AuthProvider if you want to manage client-side auth state via context.
          The Supabase middleware and server-side clients handle session for Server Components.
          Client components can also use the client-side Supabase instance directly.
          An AuthProvider can simplify access in deep component trees on the client.
        */}
        {/* <AuthProvider> */}
        <main className="flex-grow">
          {children}
        </main>
        {/* You could add a global footer here if desired */}
        {/* <footer>
          <div className="container mx-auto py-4 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Workforce Development Hub. All rights reserved.
          </div>
        </footer> */}
        {/* </AuthProvider> */}
      </body>
    </html>
  );
}