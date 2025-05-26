'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { SubTopic as SubTopicType } from '@/lib/constants';

export interface ModernSubtopicNodeData {
  label: string;
  topicId: string; // Parent topic ID
  subtopic: SubTopicType;
  parentColor?: string;
}

const ModernSubtopicNode: React.FC<NodeProps<ModernSubtopicNodeData>> = ({ data, isConnectable }) => {
  const { label, parentColor } = data;
  const borderColor = parentColor || '#60A5FA'; // Default blue

  // The entire node will be clickable for navigation via the onNodeClick
  // handler in the parent ReactFlow component.

  return (
    <div
      className="bg-white rounded-lg shadow-lg px-5 py-3 min-w-[200px] max-w-[260px] cursor-pointer hover:shadow-xl transition-all duration-200 ease-in-out hover:scale-105"
      style={{ borderLeft: `6px solid ${borderColor}` }}
      title={`Chat about ${label}`}
    >
      <p className="text-sm font-medium text-gray-800 truncate">{label}</p>
      {data.subtopic.description && (
         <p className="text-xs text-gray-500 mt-1 truncate" title={data.subtopic.description}>
            {data.subtopic.description}
        </p>
      )}
      
      <Handle
        type="target"
        position={Position.Left}
        id={`${data.subtopic.id}-target`}
        isConnectable={isConnectable}
        className="!bg-gray-400 !w-2.5 !h-2.5 !border-2 !border-white"
        style={{ left: -5 }}
      />
      {/* Optional: source handle if subtopics have further children */}
      {/* <Handle type="source" position={Position.Right} id={`${data.subtopic.id}-source`} isConnectable={isConnectable} className="!bg-gray-400 !w-2.5 !h-2.5" /> */}
    </div>
  );
};

export default memo(ModernSubtopicNode);