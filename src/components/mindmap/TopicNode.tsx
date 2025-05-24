'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Topic } from '@/lib/constants'; // Assuming your Topic type is here

// Data expected by this node: { label: string, type: 'topic', topicId: string, color?: string }
interface TopicNodeData {
  label: string;
  type: 'topic';
  topicId: string;
  color?: string;
}

const TopicNode: React.FC<NodeProps<TopicNodeData>> = ({ data, xPos, yPos, isConnectable }) => {
  // isConnectable is passed by React Flow but we might not use it directly here
  // xPos and yPos are the calculated positions, data contains our custom fields

  const nodeColor = data.color || '#0EA5E9'; // Default to a Sky blue

  return (
    <div
      style={{
        // width: 200, // Width will be set by ELK and passed by React Flow
        // height: 60, // Height will be set by ELK
        // We'll use padding and let content define size for ELK, then React Flow applies width/height
      }}
      className="px-5 py-3 rounded-lg shadow-lg"
    >
      <div
        className="font-semibold text-center text-base"
        style={{ color: 'white', backgroundColor: nodeColor, padding: '10px 15px', borderRadius: '6px' }}
      >
        {data.label}
      </div>
      {/* Handles for edges: one on the right (source) for subtopics */}
      <Handle
        type="source"
        position={Position.Right}
        id="source"
        isConnectable={isConnectable}
        className="!bg-gray-400 !w-3 !h-3"
      />
      {/* You could add a target handle if topics could be connected from the left */}
      {/* <Handle type="target" position={Position.Left} id="target" isConnectable={isConnectable} /> */}
    </div>
  );
};

export default memo(TopicNode);