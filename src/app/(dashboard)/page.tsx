import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// Placeholder for your MindMap component - we'll create this later
import MindMap from '@/components/mindmap/MindMap'; // Assuming this will be a client component
import { workforceTopics } from '@/lib/constants'; // We'll define these topics later

export const metadata = {
  title: 'Dashboard', // This will use the template from RootLayout: "Dashboard | Workforce Hub"
};

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // This check is also in DashboardLayout, but it's good practice for pages
    // that absolutely require a user to also verify.
    // The layout should catch it first.
    return redirect('/login?message=Session expired. Please log in again.');
  }

  // Here you might fetch initial data for the mind map or user-specific settings
  // For now, we'll use a predefined list of topics.

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-neutral-text">
          Welcome, {user.email || 'User'}!
        </h1>
        <p className="text-lg text-gray-600">
          Explore workforce development topics through our interactive mind map.
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Click on a topic to start an AI-powered chat and dive deeper.
        </p>
      </div>

      {/* Mind Map Visualization Area */}
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-2xl font-semibold text-neutral-text mb-4">
          Knowledge Explorer
        </h2>
        {/*
          The MindMap component will handle the interactive visualization.
          We'll pass the topics to it.
          It will likely be a client component ('use client') for interactivity.
        */}
        <MindMap topics={workforceTopics} />
        {/*
          Alternatively, if MindMap needs to be a server component initially
          or if parts are server and parts are client:
          <Suspense fallback={<p>Loading Mind Map...</p>}>
            <MindMapServerDataWrapper />
          </Suspense>
        */}
      </div>

      {/* Placeholder for other dashboard elements if any */}
      {/* <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold">Recent Activity</h3>
          <p>...</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold">Quick Links</h3>
          <p>...</p>
        </div>
      </div> */}
    </div>
  );
}