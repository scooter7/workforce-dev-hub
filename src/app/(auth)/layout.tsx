// src/app/(auth)/layout.tsx
import React from 'react';
import Link from 'next/link';
// import Image from 'next/image'; // If you want a logo in the layout header

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // This div will center the content provided by the page (e.g., LoginPage, RegisterPage)
    // The page itself will now handle its own full-screen background.
    <div className="flex flex-col items-center justify-center min-h-screen w-full">
      {/* Optional: A consistent header for all auth pages, like a logo */}
      <div className="pt-8 pb-4 text-center"> {/* Adjusted padding */}
        <Link href="/" className="inline-block">
          {/* If using an Image component for the logo: */}
          {/* <Image src="/your-logo.png" alt="Workforce Hub Logo" width={180} height={60} priority /> */}
          <h1 className="text-4xl font-bold text-brand-primary hover:text-brand-primary-dark transition-colors">
            Workforce Development Hub
          </h1>
        </Link>
      </div>

      {/* The children (LoginPage or RegisterPage) will take up the main area */}
      {/* The page itself will apply its background and centering for its form card */}
      {children} 
      
      {/* Optional: A consistent footer for all auth pages */}
      <div className="py-8 text-center text-sm text-gray-600">
        <p>&copy; {new Date().getFullYear()} Your Company Name. All rights reserved.</p>
      </div>
    </div>
  );
}