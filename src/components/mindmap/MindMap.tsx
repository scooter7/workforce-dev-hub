'use client';

import React, { useState } from 'react';
import { Topic as TopicType } from '@/lib/constants';
import TopicCard from './TopicCard'; // Import the new component

interface TopicExplorerProps { // Renamed props interface for clarity
  topics: TopicType[];
}

export default function MindMap({ topics }: TopicExplorerProps) { // Kept MindMap name for file continuity
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);

  const handleToggleExpand = (topicId: string) => {
    setExpandedTopicId(prevId => (prevId === topicId ? null : topicId));
  };

  if (!topics || topics.length === 0) {
    return <p className="text-center text-gray-500">No topics available.</p>;
  }

  return (
    <div className="w-full">
      {/* Layout: Using CSS Grid for a responsive column-row format.
        - On small screens (mobile): 1 column (implicit)
        - On medium screens (tablets): 2 columns
        - On large screens (desktops): 3 columns
        Adjust `md:grid-cols-2 lg:grid-cols-3` as needed.
        You could also use 4 or 5 columns for wider screens if you have 10 topics.
        e.g., `lg:grid-cols-4 xl:grid-cols-5` to try and fit them on one row.
        For 10 items, 2 rows of 5, or 3 rows of 3-4-3 could work.
        Let's try for a max of 3 columns for now, which will wrap.
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {topics.map((topic) => (
          <TopicCard
            key={topic.id}
            topic={topic}
            isExpanded={expandedTopicId === topic.id}
            onToggleExpand={handleToggleExpand}
          />
        ))}
      </div>
    </div>
  );
}