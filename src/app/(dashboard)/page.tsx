// src/app/(dashboard)/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { highLevelCategories, workforceTopics, Topic, HighLevelCategoryKey } from '@/lib/constants';
import {
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const categoryIcons: { [key in HighLevelCategoryKey]: React.ElementType } = {
  'career-growth': RocketLaunchIcon,
  'interpersonal-skills': UserGroupIcon,
  'personal-well-being': LightBulbIcon,
};

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
  const [stage, setStage] = useState<'intro' | 'choice' | 'explore'>('intro');
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>([]);
  const [selectedCategoryTitle, setSelectedCategoryTitle] = useState<string>('');

  useEffect(() => {
    const introTimer = setTimeout(() => {
      setStage('choice');
    }, 2500);

    return () => clearTimeout(introTimer);
  }, []);

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

  if (stage === 'intro') {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center transition-opacity duration-1000 ease-in-out z-50"
        style={{
          backgroundImage: `url(/LifeRamp_LifeRamp.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="animate-pulse">
          <h1 className="text-4xl md:text-6xl font-bold text-white text-center mb-4 [text-shadow:_2px_2px_4px_rgb(0_0_0_/_50%)]">
            Launching Your Journey...
          </h1>
          <p className="text-xl text-white/80 text-center [text-shadow:_1px_1px_2px_rgb(0_0_0_/_50%)]">
            Prepare for exploration!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {stage === 'choice' && (
        <div className="flex-grow flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-5xl text-center">
            <div className="bg-blue-50 border border-blue-200 text-blue-900 p-6 rounded-lg mb-10 text-left">
              <h2 className="text-2xl font-bold mb-3">Welcome to Your LifeRamp AI Coach Concierge!</h2>
              <p className="mb-4">
                Meet your personal AI-powered coach — always here to support your growth, career moves, and personal well-being. Whether you're navigating a career transition, seeking to level up your leadership skills, or just need help staying focused and balanced, your concierge is just a tap away.
              </p>
              <p className="mb-4">
                Think of this as your 24/7 thinking partner — ready to provide smart suggestions, guide you through exercises, answer questions, or help you prepare for your next big step. And when you need a human touch, we’ll connect you with one of our certified LifeRamp coaches.
              </p>
              <p className="font-semibold">
                Let’s build your path forward — one powerful step at a time.
              </p>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-text mb-3">Launch Your Journey</h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-10">Select a path to focus your development.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        </div>
      )}

      {stage === 'explore' && (
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
      )}
    </div>
  );
}