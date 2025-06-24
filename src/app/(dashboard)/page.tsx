'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import MindMap from '@/components/mindmap/MindMap';
import { useAuth } from '@/components/providers/AuthProvider';
import { workforceTopics } from '@/lib/constants'; // Assuming MindMap will need this

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // Simulate a loading period for the intro screen
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500); // 2.5-second loading screen

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

  // The MindMap component will now be rendered directly after loading.
  // The check for `selected_domain_id` has been removed to resolve the build error.
  // The MindMap component itself should handle the logic for displaying topics.
  return <MindMap topics={workforceTopics} />;
}
