'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Topic as TopicType } from '@/lib/constants';
import { ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

export interface ModernTopicNodeData {
  label: string;
  topic: TopicType;
}

const ModernTopicNode: React.FC<NodeProps<ModernTopicNodeData>> = ({ data, isConnectable, id: nodeId }) => {
  const { label, topic } = data;
  const nodeColor = topic.color || '#3B82F6'; // Default blue-500

  const handleActionClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent node click (navigation) when an action icon is clicked
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
          title={`Explore ${label}`}
          // onNodeClick in ReactFlow component will handle navigation for this node ID
        >
          <h3 className="text-lg font-semibold truncate" title={label}>
            {label}
          </h3>
          {topic.description && (
            <p className="text-xs text-white text-opacity-80 mt-1 max-h-10 overflow-hidden truncate" title={topic.description}>
              {topic.description}
            </p>
          )}
        </div>

        {/* Action Links/Buttons */}
        <div className="mt-3 pt-3 border-t border-white/20 flex justify-around items-center">
          <Link href={`/chat/${topic.id}`} passHref legacyBehavior>
            <a onClick={handleActionClick} title="Explore this topic" className="flex flex-col items-center text-white/80 hover:text-white transition-colors">
              <ChatBubbleLeftEllipsisIcon className="h-5 w-5 mb-0.5" />
              <span className="text-xs">Explore</span>
            </a>
          </Link>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} id={`${nodeId}-source`} isConnectable={isConnectable} className="!bg-gray-300 !w-2.5 !h-2.5 !border-2 !border-white" style={{ bottom: -5 }}/>
      <Handle type="target" position={Position.Top} id={`${nodeId}-target`} isConnectable={isConnectable} className="!bg-gray-300 !w-2.5 !h-2.5 !border-2 !border-white" style={{ top: -5 }}/>
    </div>
  );
};

export default memo(ModernTopicNode);