'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  highLevelCategories,
  workforceTopics,
  Topic,
  HighLevelCategoryKey,
  SubTopic,
} from '@/lib/constants';
import {
  ArrowLeftIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

// --- REVISED GRADIENTS (MAGENTA RE-INTRODUCED) ---
const gradients = [
  'transparent linear-gradient(284deg, #856DEA 0%, #00D6F6 100%) 0% 0% no-repeat padding-box', // Purple→Cyan
  'transparent linear-gradient(284deg, #4C78EF 0%, #00F1C3 100%) 0% 0% no-repeat padding-box', // Blue→Teal
  'transparent linear-gradient(284deg, #10CC53 0%, #4CBDEF 100%) 0% 0% no-repeat padding-box', // Green→LightBlue
  'transparent linear-gradient(284deg, #190548 0%, #4C78EF 100%) 0% 0% no-repeat padding-box', // DarkPurple→Blue
  'transparent linear-gradient(284deg, #00F1C3 0%, #10CC53 100%) 0% 0% no-repeat padding-box', // Teal→Green
  'transparent linear-gradient(284deg, #FF1994 0%, #856DEA 100%) 0% 0% no-repeat padding-box', // Pink→Purple
  'transparent linear-gradient(284deg, #FF2FC7 0%, #856DEA 100%) 0% 0% no-repeat padding-box', // Magenta→Purple
  'transparent linear-gradient(284deg, #856DEA 0%, #190548 100%) 0% 0% no-repeat padding-box', // Purple→DarkPurple
  'transparent linear-gradient(284deg, #FF2FC7 0%, #FF1994 100%) 0% 0% no-repeat padding-box', // Magenta→Pink
  'transparent linear-gradient(284deg, #4CBDEF 0%, #160644 100%) 0% 0% no-repeat padding-box', // LightBlue→DarkestPurple
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
      className="
        group 
        block 
        w-full 
        h-40
        rounded-2xl 
        shadow-lg 
        overflow-hidden 
        cursor-pointer 
        transform 
        transition-all 
        duration-300 
        hover:scale-105
      "
      style={{ background: gradientStyle }}
      title={`Chat about ${subtopic.title}`}
    >
      <div className="flex flex-col items-center justify-center h-full p-4 text-center text-white">
        <h3 className="text-xl sm:text-2xl font-bold leading-tight">
          {subtopic.title}
        </h3>
        {subtopic.description && (
          <p className="text-sm sm:text-base text-white/80 mt-1 line-clamp-2">
            {subtopic.description}
          </p>
        )}
      </div>
    </Link>
  );
}

const categoryIcons: Record<HighLevelCategoryKey, React.ElementType> = {
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
    const introTimer = setTimeout(() => setStage('choice'), 2500);
    return () => clearTimeout(introTimer);
  }, []);

  const handleCategorySelect = (categoryKey: HighLevelCategoryKey) => {
    const selectedCategory = highLevelCategories.find(c => c.id === categoryKey);
    if (!selectedCategory) return;
    setFilteredTopics(
      workforceTopics.filter(t => t.highLevelCategoryKey === categoryKey)
    );
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
        className="fixed inset-0 flex items-center justify-center z-50 bg-cover bg-center"
        style={{ backgroundImage: `url(/LifeRamp_LifeRamp.jpg)` }}
      >
        <div className="animate-pulse text-center text-white [text-shadow:_2px_2px_4px_rgb(0_0_0_/_50%)]">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Launching Your Journey...
          </h1>
          <p className="text-xl">Prepare for exploration!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {stage === 'choice' && (
        <div className="flex-grow flex flex-col items-center justify-center p-4">
          <div className="max-w-5xl text-center space-y-10">
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg flex flex-col sm:flex-row items-center gap-6">
              <Image
                src="/kai-float-1.gif"
                alt="Kai AI Coach Mascot"
                width={150}
                height={150}
                unoptimized
                className="hidden sm:block"
              />
              <div className="text-left">
                <h2 className="text-2xl sm:text-3xl font-bold text-blue-900">
                  Welcome to Your LifeRamp AI Coach Concierge!
                </h2>
                <p className="mt-2 text-gray-700">
                  Meet your personal AI‐powered coach — here to support growth,
                  career moves, and well‐being.
                </p>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-text">
              Launch Your Journey
            </h1>
            <p className="text-lg text-gray-600">
              Select a path to focus your development.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {highLevelCategories.map((category) => {
                const Icon = categoryIcons[category.id] || LightBulbIcon;
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    className="
                      group
                      p-6 
                      bg-white 
                      rounded-lg 
                      shadow-lg 
                      hover:shadow-2xl 
                      transform 
                      hover:-translate-y-1 
                      transition-all 
                      border-2 
                      border-transparent 
                      hover:border-brand-primary
                    "
                  >
                    <Icon className="h-12 w-12 mx-auto text-brand-secondary group-hover:text-brand-primary transition-colors" />
                    <h2 className="mt-4 text-xl font-semibold text-neutral-text">
                      {category.title}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                      {category.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {stage === 'explore' && (
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={handleGoBack}
            className="
              inline-flex items-center gap-2 
              text-sm font-medium text-gray-600 
              hover:text-brand-primary mb-6 transition-colors
            "
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Journeys
          </button>

          <h1 className="text-3xl font-bold text-neutral-text mb-2">
            {selectedCategoryTitle} Topics
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Select a topic below to start a conversation with your AI coach.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredTopics.map((topic) =>
              topic.subtopics.map((subtopic) => {
                const idx = subtopicCounter++;
                return (
                  <SubtopicCard
                    key={subtopic.id}
                    topicId={topic.id}
                    subtopic={subtopic}
                    index={idx}
                  />
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
