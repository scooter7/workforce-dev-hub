'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Topic as TopicType } from '@/lib/constants';
import { PlusCircleIcon, MinusCircleIcon, ChatBubbleLeftEllipsisIcon, QuestionMarkCircleIcon, AdjustmentsHorizontalIcon as GoalIcon } from '@heroicons/react/24/solid'; // Or outline
import Link from 'next/link'; // For new action links

export interface ModernTopicNodeData {
  label: string;
  topic: TopicType;
  isExpanded: boolean;
  hasSubtopics: boolean;
  onToggleExpand: () => void;
}

const ModernTopicNode: React.FC<NodeProps<ModernTopicNodeData>> = ({ data, isConnectable, id: nodeId }) => { // id is the nodeId from ReactFlow
  const { label, topic, isExpanded, hasSubtopics, onToggleExpand } = data;
  const nodeColor = topic.color || '#3B82F6'; // Default blue-500

  const handleActionClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent node click (navigation) when an action icon is clicked
  };

  const handleExpandClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onToggleExpand();
  };

  return (
    <div
      style={{ backgroundColor: nodeColor }}
      className="text-white rounded-xl shadow-xl min-w-[240px] max-w-[300px] transition-all duration-300 ease-in-out group"
    >
      {/* Main content part of the node - clicking this (not buttons) navigates to chat */}
      <div className="p-4 relative">
        <div 
          className="cursor-pointer" 
          title={`Chat about ${label}`}
          // onNodeClick in ReactFlow component will handle navigation for this node ID
        >
          <h3 className="text-lg font-semibold truncate pr-8" title={label}> {/* Added pr-8 for expand button space */}
            {label}
          </h3>
          {topic.description && !isExpanded && (
            <p className="text-xs text-white text-opacity-80 mt-1 max-h-10 overflow-hidden truncate" title={topic.description}>
              {topic.description}
            </p>
          )}
        </div>

        {/* Expand/Collapse Button */}
        {hasSubtopics && (
          <button
            onClick={handleExpandClick}
            className="absolute right-2 top-2 bg-white/20 hover:bg-white/30 text-white rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-white z-10 transition-transform duration-200 ease-in-out"
            aria-label={isExpanded ? 'Collapse subtopics' : 'Expand subtopics'}
            title={isExpanded ? 'Collapse subtopics' : 'Expand subtopics'}
          >
            {isExpanded ? (
              <MinusCircleIcon className="h-6 w-6" />
            ) : (
              <PlusCircleIcon className="h-6 w-6" />
            )}
          </button>
        )}

        {/* Action Links/Buttons - shown when expanded or always? Let's try always for now. */}
        <div className="mt-3 pt-3 border-t border-white/20 flex justify-around items-center">
          <Link href={`/chat/${topic.id}`} passHref legacyBehavior>
            <a onClick={handleActionClick} title="Chat about this topic" className="flex flex-col items-center text-white/80 hover:text-white transition-colors">
              <ChatBubbleLeftEllipsisIcon className="h-5 w-5 mb-0.5" />
              <span className="text-xs">Chat</span>
            </a>
          </Link>
          <Link href={`/quizzes?topicId=${topic.id}`} passHref legacyBehavior>
            <a onClick={handleActionClick} title="Test your knowledge" className="flex flex-col items-center text-white/80 hover:text-white transition-colors">
              <QuestionMarkCircleIcon className="h-5 w-5 mb-0.5" />
              <span className="text-xs">Quiz</span>
            </a>
          </Link>
          <Link href={`/goals?topic=${topic.id}&title=Goal for ${encodeURIComponent(topic.title)}`} passHref legacyBehavior>
            <a onClick={handleActionClick} title="Set a goal" className="flex flex-col items-center text-white/80 hover:text-white transition-colors">
              <GoalIcon className="h-5 w-5 mb-0.5" /> {/* Using AdjustmentsHorizontalIcon as GoalIcon */}
              <span className="text-xs">Goal</span>
            </a>
          </Link>
        </div>
      </div>

      <Handle type="source" position={Position.Right} id={`${nodeId}-source`} isConnectable={isConnectable} className="!bg-gray-300 !w-2.5 !h-2.5 !border-2 !border-white" style={{ right: -5 }}/>
      <Handle type="target" position={Position.Left} id={`${nodeId}-target`} isConnectable={isConnectable} className="!bg-gray-300 !w-2.5 !h-2.5 !border-2 !border-white" style={{ left: -5 }}/>
    </div>
  );
};

export default memo(ModernTopicNode);