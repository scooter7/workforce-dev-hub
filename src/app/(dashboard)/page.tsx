// src/app/(dashboard)/page.tsx
import Link from 'next/link';
import { workforceTopics } from '@/lib/constants';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';

export const metadata = {
  title: 'Explore Topics',
};

/**
 * A reusable component for displaying a subtopic as a clickable card.
 */
function SubtopicCard({ topicId, subtopic }: { topicId: string, subtopic: { id: string, title: string, description?: string }}) {
  return (
    <Link
      href={`/chat/${topicId}?subtopic=${subtopic.id}`}
      className="group block p-4 bg-white rounded-lg shadow-md hover:shadow-xl hover:border-brand-primary border-2 border-transparent transition-all duration-300 transform hover:-translate-y-1"
      title={`Chat about ${subtopic.title}`}
    >
      <h3 className="font-semibold text-neutral-text group-hover:text-brand-primary transition-colors">
        {subtopic.title}
      </h3>
      {subtopic.description && (
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
          {subtopic.description}
        </p>
      )}
      <div className="flex items-center text-xs text-brand-primary-dark opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-3">
        <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1.5" />
        <span>Start Conversation</span>
      </div>
    </Link>
  );
}


export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-text">
          Explore Topics
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Select a topic below to start a conversation with your AI coach.
        </p>
      </div>

      <div className="space-y-10">
        {workforceTopics.map((topic) => (
          <section key={topic.id}>
            <h2
              className="text-2xl font-semibold text-neutral-text mb-4 border-b-2 pb-2"
              style={{ borderColor: topic.color || '#cbd5e1' }}
            >
              {topic.title}
            </h2>
            
            {topic.subtopics.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {topic.subtopics.map((subtopic) => (
                  <SubtopicCard key={subtopic.id} topicId={topic.id} subtopic={subtopic} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">
                No specific subtopics available. You can chat about this topic in general.
              </p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}