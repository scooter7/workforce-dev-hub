'use client';

import React from 'react';
import { Topic as TopicType } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import { ChevronDownIcon, ChevronRightIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid'; // Added ChatBubble

interface TopicCardProps {
  topic: TopicType;
  isExpanded: boolean;
  onToggleExpand: (topicId: string) => void;
}

// Helper function to lighten a hex color (remains the same)
function lightenColor(hex: string, percent: number): string {
    hex = hex.replace(/^#/, '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    r = Math.min(255, Math.floor(r * (1 + percent / 100)));
    g = Math.min(255, Math.floor(g * (1 + percent / 100)));
    b = Math.min(255, Math.floor(b * (1 + percent / 100)));
    const rr = r.toString(16).padStart(2, '0');
    const gg = g.toString(16).padStart(2, '0');
    const bb = b.toString(16).padStart(2, '0');
    return `#${rr}${gg}${bb}`;
}

export default function TopicCard({ topic, isExpanded, onToggleExpand }: TopicCardProps) {
  const router = useRouter();

  const handleNavigateToMainTopicChat = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering other click handlers if nested
    router.push(`/chat/${topic.id}`);
  };

  const handleToggle = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent navigation if clicking on chevron area
    if (topic.subtopics && topic.subtopics.length > 0) {
      onToggleExpand(topic.id);
    }
  };

  const handleSubtopicClick = (subtopicId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    router.push(`/chat/${topic.id}?subtopic=${subtopicId}`);
  };

  const cardColor = topic.color || '#60A5FA'; // Default blue

  return (
    <div
      className={`rounded-xl shadow-lg transition-all duration-300 ease-in-out hover:shadow-2xl transform hover:-translate-y-1`}
      style={{ backgroundColor: isExpanded ? lightenColor(cardColor, 20) : cardColor }}
    >
      <div className={`p-5 flex flex-col`}>
        <div className="flex justify-between items-start">
          <div
            className="flex-grow cursor-pointer group"
            onClick={handleNavigateToMainTopicChat} // Click title area to navigate
            title={`Chat about ${topic.title}`}
          >
            <h3 className="text-xl md:text-2xl font-bold text-white group-hover:underline">
              {topic.title}
            </h3>
          </div>
          {topic.subtopics && topic.subtopics.length > 0 && (
            <button
              onClick={handleToggle}
              className="ml-2 p-1 rounded-full hover:bg-white/20 focus:outline-none flex-shrink-0"
              aria-label={isExpanded ? "Collapse subtopics" : "Expand subtopics"}
              title={isExpanded ? "Collapse subtopics" : "Expand subtopics"}
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-6 w-6 text-white" />
              ) : (
                <ChevronRightIcon className="h-6 w-6 text-white" />
              )}
            </button>
          )}
           {/* If no subtopics, still provide a clear visual cue for chat navigation if desired */}
           {(!topic.subtopics || topic.subtopics.length === 0) && (
             <button
              onClick={handleNavigateToMainTopicChat}
              className="ml-2 p-1 rounded-full hover:bg-white/20 focus:outline-none flex-shrink-0"
              aria-label={`Chat about ${topic.title}`}
              title={`Chat about ${topic.title}`}
            >
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
            </button>
           )}
        </div>
        {topic.description && !isExpanded && ( // Show description only if not expanded for brevity
            <p className="text-sm text-white text-opacity-80 mt-1 truncate">
                {topic.description}
            </p>
        )}
      </div>

      {/* Subtopics - shown when expanded */}
      {isExpanded && topic.subtopics && topic.subtopics.length > 0 && (
        <div className="bg-white bg-opacity-90 backdrop-blur-sm p-4 pt-3 rounded-b-lg space-y-1 max-h-60 overflow-y-auto border-t border-white/30">
          {/* Optional: Link to the general topic chat from subtopic list as well */}
          <div
            onClick={handleNavigateToMainTopicChat}
            className="block p-3 rounded-md hover:bg-gray-200 transition-colors text-gray-700 hover:text-gray-900 font-semibold cursor-pointer"
            title={`Chat generally about ${topic.title}`}
          >
            General {topic.title} Chat
          </div>
          <hr className="my-1"/>
          {topic.subtopics.map((subtopic) => (
            <div
              key={subtopic.id}
              onClick={(e) => handleSubtopicClick(subtopic.id, e)}
              className="block p-3 rounded-md hover:bg-gray-200 transition-colors text-gray-700 hover:text-gray-900 font-medium cursor-pointer"
              title={`Chat about ${subtopic.title}`}
            >
              {subtopic.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}