// src/app/(dashboard)/chat/[topicId]/page.tsx
import { workforceTopics } from '@/lib/constants';
import ChatInterface from '@/components/chat/ChatInterface';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export const revalidate = 0;

interface ChatPageProps {
  params: {
    topicId: string;
  };
  searchParams: {
    subtopic?: string;
  };
}

export async function generateMetadata({ params, searchParams }: ChatPageProps) {
  const topicId = params.topicId;
  const subtopicId = searchParams.subtopic;
  const topic = workforceTopics.find((t) => t.id === topicId);
  let pageTitle = topic ? topic.title : 'Chat';

  if (topic && subtopicId) {
    const subtopic = topic.subtopics.find((st) => st.id === subtopicId);
    if (subtopic) {
      pageTitle = `${subtopic.title} - ${topic.title}`;
    }
  }
  return {
    title: pageTitle,
  };
}

export default async function ChatPage({ params, searchParams }: ChatPageProps) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect(`/login?message=Please log in to access the chat.`);
  }

  const topicId = params.topicId;
  const subtopicId = searchParams.subtopic;

  // Since our dashboard flow now requires a subtopic, we check for it first.
  if (!subtopicId) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
            <h1 className="text-2xl font-bold text-neutral-text mb-2">Subtopic Not Selected</h1>
            <p className="text-gray-600 mb-6">Please go back to the dashboard and select a specific subtopic to chat about.</p>
            <Link href="/" className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark transition-colors">
                Return to Dashboard
            </Link>
        </div>
    );
  }

  const currentTopic = workforceTopics.find((t) => t.id === topicId);
  const currentSubtopic = currentTopic?.subtopics.find((st) => st.id === subtopicId);

  // --- THIS IS THE FIX ---
  // If the topic or subtopic from the URL is invalid, render a "Not Found" page.
  // This guarantees that if we proceed, both `currentTopic` and `currentSubtopic` are valid.
  if (!currentTopic || !currentSubtopic) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <h1 className="text-2xl font-bold text-neutral-text mb-2">Content Not Found</h1>
        <p className="text-gray-600 mb-6">
          The topic or subtopic you're looking for doesn't exist or may have been moved.
        </p>
        <Link href="/" className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark transition-colors">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // At this point, TypeScript knows `currentTopic` and `currentSubtopic` are defined, fixing the error.
  return (
    <div className="h-full">
      <ChatInterface
        topic={currentTopic}
        subtopic={currentSubtopic}
      />
    </div>
  );
}