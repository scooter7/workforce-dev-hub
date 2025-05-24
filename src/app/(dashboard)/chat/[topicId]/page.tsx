import { workforceTopics, Topic, SubTopic } from '@/lib/constants';
import ChatInterface from '@/components/chat/ChatInterface'; // We'll create this client component
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/solid'; // Using Heroicons for a back button icon

// Opt-in for dynamic rendering if not automatically inferred
// export const dynamic = 'force-dynamic';

interface ChatPageProps {
  params: {
    topicId: string;
  };
  searchParams: {
    subtopic?: string; // subtopicId will come from here
  };
}

// Optional: Generate static params if your topics are fixed and you want SSG for these pages
// export async function generateStaticParams() {
//   const paths: { topicId: string; subtopic?: string }[] = [];
//   workforceTopics.forEach(topic => {
//     paths.push({ topicId: topic.id });
//     topic.subtopics.forEach(subtopic => {
//       // For query params, static generation is more complex.
//       // Typically, you'd make subtopics part of the path, e.g., /chat/[topicId]/[subtopicId]
//       // For now, we'll handle subtopic as a query param dynamically.
//     });
//   });
//   return paths.map(p => ({ topicId: p.topicId }));
// }


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
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Should be caught by DashboardLayout, but good for safety
    return redirect(`/login?message=Please log in to access the chat.`);
  }

  const topicId = params.topicId;
  const subtopicId = searchParams.subtopic;

  const currentTopic = workforceTopics.find((t) => t.id === topicId);

  if (!currentTopic) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-semibold text-red-600">Topic Not Found</h1>
        <p>The chat topic you are looking for does not exist.</p>
        <Link href="/" className="text-brand-primary hover:underline mt-4 inline-block">
          &larr; Back to Dashboard
        </Link>
      </div>
    );
  }

  let currentSubtopic: SubTopic | undefined = undefined;
  let chatFocusTitle = currentTopic.title;
  let knowledgeBaseScope = { topicId: currentTopic.id }; // For RAG

  if (subtopicId) {
    currentSubtopic = currentTopic.subtopics.find((st) => st.id === subtopicId);
    if (currentSubtopic) {
      chatFocusTitle = `${currentSubtopic.title} (${currentTopic.title})`;
      // @ts-ignore
      knowledgeBaseScope.subtopicId = currentSubtopic.id; // For more specific RAG
    } else {
      // Subtopic ID provided but not found, could show an error or default to main topic
      // For simplicity, we'll proceed with the main topic if subtopic is invalid
      console.warn(`Subtopic with ID "${subtopicId}" not found for topic "${currentTopic.title}". Defaulting to main topic.`);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-var(--navbar-height,4rem)-2rem)]"> {/* Adjust height based on your navbar */}
      <div className="mb-4 p-4 bg-white shadow rounded-lg">
        <Link href="/" className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark mb-2 text-sm">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Explore and Chat
        </Link>
        <h1 className="text-2xl font-bold text-neutral-text">
          Chatting about: <span className="text-brand-primary">{chatFocusTitle}</span>
        </h1>
        {currentTopic.description && !currentSubtopic && (
          <p className="text-sm text-gray-600 mt-1">{currentTopic.description}</p>
        )}
        {currentSubtopic?.description && (
          <p className="text-sm text-gray-600 mt-1">{currentSubtopic.description}</p>
        )}
      </div>

      {/* ChatInterface will be a client component to handle the chat interactions */}
      <ChatInterface
        topic={currentTopic}
        subtopic={currentSubtopic}
        initialSystemMessage={`You are an AI assistant focused on workforce development. Let's discuss ${chatFocusTitle}.`}
        knowledgeBaseScope={knowledgeBaseScope} // Pass scope for RAG
        userId={user.id} // Pass user ID for context/history/points
      />
    </div>
  );
}