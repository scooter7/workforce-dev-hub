'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface SubtopicNodeData {
  label: string;
  type: 'subtopic';
  topicId: string;
  subtopicId: string;
  parentColor?: string;
}

// Corrected: Prefixed unused xPos and yPos with underscores
const SubtopicNode: React.FC<NodeProps<SubtopicNodeData>> = ({ data, xPos: _xPos, yPos: _yPos, isConnectable }) => {
  const borderColor = data.parentColor || '#0EA5E9'; // Default blue

  return (
    <div
      className="px-4 py-2 rounded-md shadow bg-white"
      // width and height are applied by React Flow based on node definition from ELK
    >
      <div
        className="text-center text-sm font-medium"
        style={{ color: '#374151' /* Gray-700 */, borderLeft: `4px solid ${borderColor}`, paddingLeft: '8px' }}
      >
        {data.label}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        id="target"
        isConnectable={isConnectable}
        className="!bg-gray-400 !w-3 !h-3"
      />
    </div>
  );
};

export default memo(SubtopicNode);