// src/app/(dashboard)/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { highLevelCategories, workforceTopics, Topic, HighLevelCategoryKey } from '@/lib/constants';
import {
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

// A mapping of category keys to icons for the journey selection screen.
// Updated to match the new HighLevelCategoryKeys
const categoryIcons: { [key in HighLevelCategoryKey]: React.ElementType } = {
  'career-growth': RocketLaunchIcon,
  'interpersonal-skills': UserGroupIcon,
  'personal-well-being': LightBulbIcon,
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
  const [stage, setStage] = useState<'choice' | 'explore'>('choice');
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>([]);
  const [selectedCategoryTitle, setSelectedCategoryTitle] = useState<string>('');

  const handleCategorySelect = (categoryKey: HighLevelCategoryKey) => {
    const selectedCategory = highLevelCategories.find(c => c.id === categoryKey);
    if (!selectedCategory) return;

    const topicsForCategory = workforceTopics.filter(
      (topic) => topic.highLevelCategoryKey === categoryKey
    );

    setFilteredTopics(topicsForCategory);
    setSelectedCategoryTitle(selectedCategory.title);
    setStage('explore');
  };

  const handleGoBack = () => {
    setStage('choice');
    setFilteredTopics([]);
    setSelectedCategoryTitle('');
  };

  if (stage === 'choice') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-text mb-3">Launch Your Journey</h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-10">Select a path to focus your development.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          {highLevelCategories.map((category) => {
            const Icon = categoryIcons[category.id] || LightBulbIcon;
            return (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className="group p-6 text-center bg-white rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-brand-primary"
              >
                <Icon className="h-12 w-12 mx-auto text-brand-secondary transition-colors group-hover:text-brand-primary" />
                <h2 className="text-xl font-semibold text-neutral-text mt-4">{category.title}</h2>
                <p className="text-gray-600 mt-2 text-sm">{category.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <button
          onClick={handleGoBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-brand-primary mb-4 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Journeys
        </button>
        <h1 className="text-3xl font-bold text-neutral-text">
          {selectedCategoryTitle} Topics
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Select a topic below to start a conversation with your AI coach.
        </p>
      </div>

      <div className="space-y-10">
        {filteredTopics.map((topic) => (
          <section key={topic.id}>
            <h2
              className="text-2xl font-semibold text-neutral-text mb-4 border-b-2 pb-2"
              style={{ borderColor: topic.color || '#cbd5e1' }}
            >
              {topic.title}
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {topic.subtopics.map((subtopic) => (
                <SubtopicCard key={subtopic.id} topicId={topic.id} subtopic={subtopic} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}