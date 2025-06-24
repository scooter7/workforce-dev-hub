'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import MindMap from '@/components/mindmap/MindMap';
import { useAuth } from '@/components/providers/AuthProvider';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();

  useEffect(() => {
    // Simulate a loading period
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000); // 3-second loading screen

    return () => clearTimeout(timer);
  }, []);

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-gray-800 absolute inset-0">
        <div className="text-center p-4">
            <Image
                src="/LifeRamp_LifeRamp.jpg"
                alt="LifeRamp Logo"
                width={500}
                height={500}
                priority
                className="w-11/12 max-w-xs sm:max-w-sm md:max-w-md h-auto object-contain inline-block"
            />
            <h1 className="text-2xl font-bold mt-4 text-gray-800 dark:text-gray-200">Preparing your journey...</h1>
            <div className="mt-4">
                <Image 
                    unoptimized 
                    src="https://workforce-dev-hub.vercel.app/kai-float-1.gif" 
                    alt="Kai floating" 
                    width={100} 
                    height={100} 
                    className="inline-block"
                />
            </div>
        </div>
      </div>
    );
  }

  // Check if user has a selected domain
  const hasSelectedDomain = profile?.selected_domain_id;

  if (!hasSelectedDomain) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold mb-4">Welcome to LifeRamp!</h2>
        <p className="mb-4">Please select a domain from your profile to get started.</p>
        <Link href="/profile" className="inline-block bg-brand-primary text-white px-6 py-2 rounded-md hover:bg-brand-primary-dark transition-colors">
          Go to Profile
        </Link>
      </div>
    )
  }

  return <MindMap />;
}
