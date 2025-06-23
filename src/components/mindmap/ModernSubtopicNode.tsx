'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { SubTopic as SubTopicType } from '@/lib/constants';
import Link from 'next/link';
import { ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/solid';

export interface ModernSubtopicNodeData {
  label: string;
  topicId: string; // Parent topic ID
  subtopic: SubTopicType;
  parentColor?: string;
}

const ModernSubtopicNode: React.FC<NodeProps<ModernSubtopicNodeData>> = ({ data, isConnectable, id: nodeId }) => {
  const { label, topicId, subtopic, parentColor } = data;
  // Use parentColor for the background, with a neutral dark gray fallback.
  const backgroundColor = parentColor || '#4b5563'; 

  const handleActionClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  return (
    <div
      className="rounded-lg shadow-lg px-5 py-4 min-w-[240px] max-w-[300px] group text-white"
      style={{ backgroundColor }} // Apply the dynamic background color
    >
      <div className="cursor-pointer" title={`Explore ${label}`}>
        <p className="text-base font-semibold truncate">{label}</p>
        {subtopic.description && (
          <p className="text-sm text-gray-200 mt-1 truncate" title={subtopic.description}>
            {subtopic.description}
          </p>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-white/20 flex justify-around items-center">
        <Link href={`/chat/${topicId}?subtopic=${subtopic.id}`} passHref legacyBehavior>
          <a onClick={handleActionClick} title="Explore this subtopic" className="flex flex-col items-center hover:opacity-80 transition-opacity">
            <ChatBubbleLeftEllipsisIcon className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Explore</span>
          </a>
        </Link>
      </div>

      <Handle type="target" position={Position.Top} id={`${nodeId}-target`} isConnectable={isConnectable} className="!bg-transparent" style={{border: 'none'}} />
    </div>
  );
};

export default memo(ModernSubtopicNode);