'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
// Assuming Topic type is not directly used here other than for data structure.
// If Topic type definition is needed, import { Topic } from '@/lib/constants';

interface TopicNodeData {
  label: string;
  type: 'topic';
  topicId: string;
  color?: string;
}

// Corrected: Prefixed unused xPos and yPos with underscores
const TopicNode: React.FC<NodeProps<TopicNodeData>> = ({ data, xPos: _xPos, yPos: _yPos, isConnectable }) => {
  const nodeColor = data.color || '#0EA5E9'; // Default to a Sky blue

  return (
    <div
      className="px-5 py-3 rounded-lg shadow-lg"
      // width and height are applied by React Flow based on node definition from ELK
    >
      <div
        className="font-semibold text-center text-base"
        style={{ color: 'white', backgroundColor: nodeColor, padding: '10px 15px', borderRadius: '6px' }}
      >
        {data.label}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="source"
        isConnectable={isConnectable}
        className="!bg-gray-400 !w-3 !h-3"
      />
    </div>
  );
};

export default memo(TopicNode);