import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Applying the responsive background image to the root container
    <div
      className="flex flex-col items-center justify-between min-h-screen w-full bg-no-repeat bg-contain md:bg-cover bg-center"
      style={{
        backgroundImage: "url('/LifeRamp_LifeRamp.jpg')",
      }}
    >
      {/* The header is removed to allow the background image to be the main focus.
        The login/register forms will be the primary content.
      */}
      <div className="w-full h-20"></div> {/* Spacer to push content down from the top */}

      {/* The 'children' will be the LoginPage or RegisterPage content. */}
      <div className="w-full flex-grow flex items-center justify-center">
        {children}
      </div>
      
      {/* A consistent footer for all auth pages */}
      <div className="py-4 text-center text-sm text-white/80 bg-black/20 w-full">
        <p>&copy; {new Date().getFullYear()} LifeRamp. All rights reserved.</p>
      </div>
    </div>
  );
}