import React from 'react';
import Link from 'next/link';
// You might want to import your app's logo if you have one in public/images
// import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-sky-100 via-indigo-50 to-purple-100 p-4">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-block">
          {/* Replace with your actual logo if you have one */}
          {/* <Image
            src="/images/logo.png" // Path to your logo in the public folder
            alt="Workforce Hub Logo"
            width={150} // Adjust as needed
            height={50} // Adjust as needed
            priority // Load logo quickly
          /> */}
          <h1 className="text-4xl font-bold text-brand-primary hover:text-brand-primary-dark transition-colors">
            Workforce Development Hub
          </h1>
        </Link>
      </div>
      <div className="w-full max-w-md">
        {/* The children will be the specific auth page (e.g., Login page, Register page) */}
        {children}
      </div>
      <div className="mt-8 text-center text-sm text-gray-600">
        <p>&copy; {new Date().getFullYear()} Your Company Name. All rights reserved.</p>
        {/* You can add links to privacy policy or terms of service here */}
        {/* <p className="mt-1">
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link> |
          <Link href="/terms" className="hover:underline">Terms of Service</Link>
        </p> */}
      </div>
    </div>
  );
}