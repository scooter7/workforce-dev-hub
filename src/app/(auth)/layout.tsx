import React from 'react';
import Link from 'next/link';
// import Image from 'next/image'; // Uncomment if you add a logo image here

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // This root div should primarily focus on layout (centering, min-height)
    // and NOT apply a competing full-page background if child pages set their own.
    <div className="flex flex-col items-center justify-center min-h-screen w-full">
      
      {/* Optional: A consistent header for all auth pages */}
      <div className="py-8 text-center"> {/* Increased padding for better spacing */}
        <Link href="/" className="inline-block">
          {/* Example if using an Image component for the logo:
          <Image 
            src="/your-company-logo.png" // Place your logo in /public
            alt="Power Skills Logo" 
            width={180} // Adjust
            height={60}  // Adjust
            priority 
          /> 
          */}
          <h1 className="text-4xl font-bold text-brand-primary hover:text-brand-primary-dark transition-colors">
            Power Skills
          </h1>
        </Link>
      </div>

      {/* The 'children' will be the LoginPage or RegisterPage content.
          These pages will now apply their own full-screen background image.
          The `w-full` ensures the child page can potentially use the full width.
      */}
      <div className="w-full flex-grow flex"> {/* Added flex-grow and flex to allow child to fill */}
        {children}
      </div>
      
      {/* Optional: A consistent footer for all auth pages */}
      <div className="py-8 text-center text-sm text-gray-600">
        <p>&copy; {new Date().getFullYear()} LifeRamp. All rights reserved.</p>
        {/* <p className="mt-1">
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link> |
          <Link href="/terms" className="hover:underline">Terms of Service</Link>
        </p> 
        */}
      </div>
    </div>
  );
}