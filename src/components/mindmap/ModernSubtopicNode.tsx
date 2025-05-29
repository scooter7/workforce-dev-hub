'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { SubTopic as SubTopicType } from '@/lib/constants';
import Link from 'next/link';
import { ChatBubbleLeftEllipsisIcon, QuestionMarkCircleIcon, AdjustmentsHorizontalIcon as GoalIcon } from '@heroicons/react/24/solid';

export interface ModernSubtopicNodeData {
  label: string;
  topicId: string; // Parent topic ID
  subtopic: SubTopicType;
  parentColor?: string;
}

const ModernSubtopicNode: React.FC<NodeProps<ModernSubtopicNodeData>> = ({ data, isConnectable, id: nodeId }) => {
  const { label, topicId, subtopic, parentColor } = data;
  const borderColor = parentColor || '#60A5FA';

  const handleActionClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  return (
    <div
      className="bg-white rounded-lg shadow-lg px-4 py-3 min-w-[220px] max-w-[280px] group"
      style={{ borderLeft: `5px solid ${borderColor}` }}
    >
      {/* Main clickable area for chat navigation */}
      <div className="cursor-pointer" title={`Chat about ${label}`}>
        <p className="text-sm font-semibold text-gray-800 truncate">{label}</p>
        {subtopic.description && (
          <p className="text-xs text-gray-500 mt-0.5 truncate" title={subtopic.description}>
            {subtopic.description}
          </p>
        )}
      </div>

      {/* Action Links/Buttons */}
      <div className="mt-2 pt-2 border-t border-gray-200 flex justify-around items-center">
        <Link href={`/chat/${topicId}?subtopic=${subtopic.id}`} passHref legacyBehavior>
          <a onClick={handleActionClick} title="Chat about this subtopic" className="flex flex-col items-center text-gray-600 hover:text-brand-primary transition-colors">
            <ChatBubbleLeftEllipsisIcon className="h-5 w-5 mb-0.5" />
            <span className="text-xs">Chat</span>
          </a>
        </Link>
        <Link href={`/quizzes?topicId=${topicId}&subtopicId=${subtopic.id}`} passHref legacyBehavior>
          <a onClick={handleActionClick} title="Test your knowledge" className="flex flex-col items-center text-gray-600 hover:text-brand-primary transition-colors">
            <QuestionMarkCircleIcon className="h-5 w-5 mb-0.5" />
            <span className="text-xs">Quiz</span>
          </a>
        </Link>
        <Link href={`/goals?subtopic=${subtopic.id}&topic=${topicId}&title=Goal for ${encodeURIComponent(subtopic.title)}`} passHref legacyBehavior>
          <a onClick={handleActionClick} title="Set a goal" className="flex flex-col items-center text-gray-600 hover:text-brand-primary transition-colors">
            <GoalIcon className="h-5 w-5 mb-0.5" />
            <span className="text-xs">Goal</span>
          </a>
        </Link>
      </div>

      <Handle type="target" position={Position.Left} id={`${nodeId}-target`} isConnectable={isConnectable} className="!bg-gray-300 !w-2.5 !h-2.5 !border-2 !border-white" style={{ left: -5 }}/>
      {/* Optional: Source handle if subtopics have children */}
    </div>
  );
};

export default memo(ModernSubtopicNode);