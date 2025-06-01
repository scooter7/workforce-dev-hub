// src/app/layout.tsx
import SupabaseProvider from '@/components/providers/SupabaseProvider';
import AuthProvider from '@/components/providers/AuthProvider';
import Sidebar from '@/components/layout/Sidebar';
// ... other imports

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} flex flex-col md:flex-row h-screen bg-neutral-bg antialiased`}>
        <SupabaseProvider>
          <AuthProvider> {/* Sidebar and children are within AuthProvider */}
            <Sidebar /> 
            <main className="flex-grow flex flex-col overflow-y-auto">
              {children}
            </main>
            {/* ... Toaster ... */}
          </AuthProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}