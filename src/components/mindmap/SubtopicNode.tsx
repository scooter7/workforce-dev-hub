'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

// Data expected: { label: string, type: 'subtopic', topicId: string, subtopicId: string, parentColor?: string }
interface SubtopicNodeData {
  label: string;
  type: 'subtopic';
  topicId: string;
  subtopicId: string;
  parentColor?: string;
}

const SubtopicNode: React.FC<NodeProps<SubtopicNodeData>> = ({ data, xPos, yPos, isConnectable }) => {
  const borderColor = data.parentColor || '#0EA5E9';

  return (
    <div
      style={{
        // width: 180, // Width will be set by ELK
        // height: 50, // Height will be set by ELK
      }}
      className="px-4 py-2 rounded-md shadow bg-white"
    >
      <div
        className="text-center text-sm font-medium"
        style={{ color: '#374151' /* Gray-700 */, borderLeft: `4px solid ${borderColor}`, paddingLeft: '8px' }}
      >
        {data.label}
      </div>
      {/* Handle on the left (target) to connect from a main topic */}
      <Handle
        type="target"
        position={Position.Left}
        id="target"
        isConnectable={isConnectable}
        className="!bg-gray-400 !w-3 !h-3"
      />
      {/* Optional: A source handle if subtopics can lead to further nodes */}
      {/* <Handle type="source" position={Position.Right} id="source" isConnectable={isConnectable} /> */}
    </div>
  );
};

export default memo(SubtopicNode);