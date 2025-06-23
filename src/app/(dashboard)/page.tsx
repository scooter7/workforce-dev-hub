'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Import the Next.js Image component
import { highLevelCategories, workforceTopics, Topic, HighLevelCategoryKey, SubTopic } from '@/lib/constants';
import {
  ArrowLeftIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const gradients = [
  'transparent linear-gradient(284deg, #856DEA 0%, #00D6F6 100%) 0% 0% no-repeat padding-box',
  'transparent linear-gradient(284deg, #4C78EF 0%, #00F1C3 100%) 0% 0% no-repeat padding-box',
  'transparent linear-gradient(284deg, #10CC53 0%, #4CBDEF 100%) 0% 0% no-repeat padding-box',
  'transparent linear-gradient(284deg, #4CB0EF 0%, #10CC53 100%) 0% 0% no-repeat padding-box',
  'transparent linear-gradient(284deg, #00D6F6 0%, #4C78EF 100%) 0% 0% no-repeat padding-box',
  'transparent linear-gradient(284deg, #190548 0%, #4C78EF 100%) 0% 0% no-repeat padding-box',
  'transparent linear-gradient(284deg, #00F1C3 0%, #10CC53 100%) 0% 0% no-repeat padding-box',
  'transparent linear-gradient(284deg, #856DEA 0%, #190548 100%) 0% 0% no-repeat padding-box',
  'transparent linear-gradient(284deg, #4CBDEF 0%, #4CB0EF 100%) 0% 0% no-repeat padding-box',
  'transparent linear-gradient(284deg, #4CBDEF 0%, #160644 100%) 0% 0% no-repeat padding-box',
];

interface SubtopicCardProps {
  topicId: string;
  subtopic: SubTopic;
  index: number;
}

function SubtopicCard({ topicId, subtopic, index }: SubtopicCardProps) {
  const gradientStyle = gradients[index % gradients.length];

  return (
    <Link
      href={`/chat/${topicId}?subtopic=${subtopic.id}`}
      className="group block rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105"
      style={{
        width: '361px',
        height: '160px',
        background: gradientStyle,
      }}
      title={`Chat about ${subtopic.title}`}
    >
      <div className="flex flex-col items-center justify-center h-full p-5 text-center text-white">
        <h3 className="text-2xl font-bold">
          {subtopic.title}
        </h3>
        {subtopic.description && (
          <p className="text-base text-white/80 mt-2 line-clamp-2">
            {subtopic.description}
          </p>
        )}
      </div>
    </Link>
  );
}

const categoryIcons: { [key in HighLevelCategoryKey]: React.ElementType } = {
  'career-growth': RocketLaunchIcon,
  'interpersonal-skills': UserGroupIcon,
  'personal-well-being': LightBulbIcon,
};

export default function DashboardPage() {
  const [stage, setStage] = useState<'intro' | 'choice' | 'explore'>('intro');
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>([]);
  const [selectedCategoryTitle, setSelectedCategoryTitle] = useState<string>('');
  
  let subtopicCounter = 0;

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
            
            {/* --- THIS IS THE UPDATED WELCOME SECTION --- */}
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-10 flex items-center gap-x-8">
              <Image
                src="/kai-float-1.gif"
                alt="Kai AI Coach Mascot"
                width={150}
                height={150}
                unoptimized={true} // Use this prop for GIFs to prevent them from becoming static
                className="hidden sm:block" // Hide on small screens to save space
              />
              <div className="text-left text-blue-900">
                <h2 className="text-2xl font-bold mb-3">Welcome to Your LifeRamp AI Coach Concierge!</h2>
                <p>
                  Meet your personal AI-powered coach — always here to support your growth, career moves, and personal well-being. Whether you're navigating a career transition, seeking to level up your leadership skills, or just need help staying focused and balanced, your concierge is just a tap away.
                </p>
              </div>
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
                <div className="flex flex-wrap gap-6">
                  {topic.subtopics.map((subtopic) => {
                    const cardIndex = subtopicCounter++;
                    return <SubtopicCard key={subtopic.id} topicId={topic.id} subtopic={subtopic} index={cardIndex} />;
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}