// src/app/(dashboard)/page.tsx
'use client'; // This will be a client component to manage state

import { useState, useEffect } from 'react';
import { highLevelCategories, workforceTopics, HighLevelCategoryKey, Topic } from '@/lib/constants';
import MindMap from '@/components/mindmap/MindMap'; // Your React Flow mind map component
import Image from 'next/image';

// Define states for the user's journey
type JourneyStage = 'intro' | 'choice' | 'map';

export default function DashboardPage() {
  const [stage, setStage] = useState<JourneyStage>('intro'); // Start with intro
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<HighLevelCategoryKey | null>(null);
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>([]);
  const [showIntroAnimation, setShowIntroAnimation] = useState(true);

  useEffect(() => {
    // Simulate an intro animation or delay
    const timer = setTimeout(() => {
      setShowIntroAnimation(false);
      setStage('choice'); // Move to choice stage after intro
    }, 2500); // Adjust delay as needed for your "journey into space" feel

    return () => clearTimeout(timer);
  }, []);

  const handleHighLevelChoice = (categoryKey: HighLevelCategoryKey) => {
    setSelectedCategoryKey(categoryKey);
    const relevantTopics = workforceTopics.filter(topic => topic.highLevelCategoryKey === categoryKey);
    setFilteredTopics(relevantTopics);
    setStage('map');
  };

  const handleBackToChoices = () => {
    setStage('choice');
    setSelectedCategoryKey(null);
    setFilteredTopics([]);
  };
  
  const handleBackToIntro = () => { // In case they want to "re-launch"
    setShowIntroAnimation(true);
    setStage('intro');
    setSelectedCategoryKey(null);
    setFilteredTopics([]);
    // Re-trigger intro animation
    const timer = setTimeout(() => {
      setShowIntroAnimation(false);
      setStage('choice');
    }, 2500);
     // This might need a more robust way to re-trigger if it's a CSS animation
  };


  if (showIntroAnimation && stage === 'intro') {
    return (
      <div 
        className="fixed inset-0 flex flex-col items-center justify-center transition-opacity duration-1000 ease-in-out"
        style={{
          backgroundImage: `url(/LifeRamp_LifeRamp.jpg)`, // Path to your image in /public
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* "Launch from bottom" - placeholder for animation */}
        <div className="animate-pulse"> {/* Replace with actual launch animation */}
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
    <div 
      className="flex flex-col items-center min-h-full p-4 md:p-8 transition-opacity duration-500 ease-in-out"
      style={{
        backgroundImage: stage !== 'map' ? `url(/LifeRamp_LifeRamp.jpg)` : 'none', // Background for choice stage
        backgroundColor: stage === 'map' ? 'var(--neutral-bg-color)' : 'transparent', // Fallback or map background
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: stage !== 'map' ? 'fixed' : 'scroll',
      }}
    >
      {stage === 'choice' && (
        <div className="w-full max-w-4xl text-center mt-10 md:mt-20">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 md:mb-12 [text-shadow:_2px_2px_4px_rgb(0_0_0_/_50%)]">
            Choose Your Path
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {highLevelCategories.map(category => (
              <button
                key={category.id}
                onClick={() => handleHighLevelChoice(category.id)}
                className="bg-white/80 backdrop-blur-md hover:bg-white text-brand-primary p-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-opacity-50"
              >
                {/* Add category.illustration here if you have images */}
                <h2 className="text-2xl font-semibold mb-2">{category.title}</h2>
                <p className="text-sm text-gray-700">{category.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {stage === 'map' && selectedCategoryKey && (
        <div className="w-full">
          <div className="mb-6 flex justify-start">
            <button 
              onClick={handleBackToChoices} 
              className="text-sm text-brand-primary hover:text-brand-primary-dark font-medium py-2 px-4 rounded-lg bg-white/80 hover:bg-white shadow transition-colors"
            >
              &larr; Back to Path Selection
            </button>
          </div>
          <MindMap topics={filteredTopics} />
        </div>
      )}
    </div>
  );
}