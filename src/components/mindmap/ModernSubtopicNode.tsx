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
      <div className="cursor-pointer" title={`Explore ${label}`}>
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
          <a onClick={handleActionClick} title="Explore this subtopic" className="flex flex-col items-center text-gray-600 hover:text-brand-primary transition-colors">
            <ChatBubbleLeftEllipsisIcon className="h-5 w-5 mb-0.5" />
            <span className="text-xs">Explore</span>
          </a>
        </Link>
      </div>

      <Handle type="target" position={Position.Top} id={`${nodeId}-target`} isConnectable={isConnectable} className="!bg-gray-300 !w-2.5 !h-2.5 !border-2 !border-white" style={{ top: -5 }}/>
    </div>
  );
};

export default memo(ModernSubtopicNode);