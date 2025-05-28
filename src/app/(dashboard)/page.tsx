// src/app/(dashboard)/page.tsx
'use client'; // <<< THIS IS ESSENTIAL because of useState and useEffect

import { useState, useEffect } from 'react';
import { highLevelCategories, workforceTopics, HighLevelCategoryKey, Topic } from '@/lib/constants';
import MindMap from '@/components/mindmap/MindMap'; // Your React Flow mind map component
// Image import was removed as per previous fix for unused import

type JourneyStage = 'intro' | 'choice' | 'map';

export default function DashboardPage() {
  const [stage, setStage] = useState<JourneyStage>('intro');
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<HighLevelCategoryKey | null>(null);
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>([]);
  const [showIntroScreen, setShowIntroScreen] = useState(true); // Renamed for clarity

  useEffect(() => {
    // Simulate an intro animation or delay
    const introTimer = setTimeout(() => {
      setShowIntroScreen(false); // Hide intro screen
      setStage('choice');      // Move to choice stage
    }, 2500); // Adjust delay (e.g., 2.5 seconds)

    return () => clearTimeout(introTimer); // Cleanup timer on unmount
  }, []); // Run only once on mount

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

  // const handleBackToIntro = () => { ... }; // This was commented out previously

  if (showIntroScreen && stage === 'intro') { // Check showIntroScreen first
    return (
      <div 
        className="fixed inset-0 flex flex-col items-center justify-center transition-opacity duration-1000 ease-in-out z-50" // Added z-50
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

  // Main content area (choice or map)
  return (
    <div 
      className="flex flex-col items-center min-h-full w-full p-4 md:p-8 transition-opacity duration-500 ease-in-out"
      // Apply background only if not in map stage, or use a default for map stage
      style={{
        backgroundImage: stage !== 'map' ? `url(/LifeRamp_LifeRamp.jpg)` : 'none',
        backgroundColor: stage === 'map' ? 'var(--neutral-bg-color, #F9FAFB)' : 'transparent',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: stage !== 'map' ? 'fixed' : 'scroll',
      }}
    >
      {stage === 'choice' && !showIntroScreen && ( // Also ensure intro is not showing
        <div className="w-full max-w-4xl text-center mt-10 md:mt-20 py-10"> {/* Added py-10 for spacing */}
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 md:mb-12 [text-shadow:_2px_2px_4px_rgb(0_0_0_/_50%)]">
            Choose Your Path
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {highLevelCategories.map(category => (
              <button
                key={category.id}
                onClick={() => handleHighLevelChoice(category.id)}
                className="bg-white/80 backdrop-blur-sm hover:bg-white text-brand-primary p-6 md:p-8 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1.5 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-opacity-75"
              >
                <h2 className="text-xl lg:text-2xl font-semibold mb-2">{category.title}</h2>
                <p className="text-sm text-gray-700">{category.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {stage === 'map' && selectedCategoryKey && (
        <div className="w-full mt-4 md:mt-0"> {/* Adjusted margin for map view */}
          <div className="mb-6 flex justify-start">
            <button 
              onClick={handleBackToChoices} 
              className="text-sm text-brand-primary hover:text-brand-primary-dark font-medium py-2 px-4 rounded-lg bg-white hover:bg-gray-50 shadow-md transition-colors"
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