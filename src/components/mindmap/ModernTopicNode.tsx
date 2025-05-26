'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { Topic as TopicType } from '@/lib/constants';
import { PlusCircleIcon, MinusCircleIcon } from '@heroicons/react/24/solid';

// Data expected by this node, passed from MindMap.tsx
export interface ModernTopicNodeData {
  label: string;
  topic: TopicType; // Full topic object for color, description etc.
  isExpanded: boolean;
  hasSubtopics: boolean;
  onToggleExpand: () => void; // Callback passed from parent to toggle expansion
}

const ModernTopicNode: React.FC<NodeProps<ModernTopicNodeData>> = ({ data, isConnectable }) => {
  const { label, topic, isExpanded, hasSubtopics, onToggleExpand } = data;
  const nodeColor = topic.color || '#3B82F6'; // Default Tailwind blue-500

  // Access React Flow instance if needed for other interactions, e.g., fitView on expand
  // const { fitView } = useReactFlow();

  const handleExpandClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // Important: Prevent the node's main click (for navigation)
    onToggleExpand();
    // Optional: After toggling, you might want to adjust the view
    // setTimeout(() => fitView({ duration: 300, padding: 0.2 }), 50);
  };

  // The entire node (except the expand button) will be clickable for navigation
  // via the onNodeClick handler in the parent ReactFlow component.

  return (
    <div
      style={{ backgroundColor: nodeColor }}
      className="text-white rounded-xl shadow-xl min-w-[230px] max-w-[280px] transition-all duration-300 ease-in-out hover:shadow-2xl group"
    >
      <div className="p-4 flex flex-col relative"> {/* Added relative for positioning button */}
        <div className="flex-grow"> {/* Main content area of the node */}
          <h3 className="text-lg font-semibold truncate" title={label}>
            {label}
          </h3>
          {topic.description && !isExpanded && ( // Show description only when collapsed
            <p className="text-xs text-white text-opacity-80 mt-1 max-h-10 overflow-hidden" title={topic.description}>
              {topic.description}
            </p>
          )}
        </div>

        {/* Expand/Collapse Button - positioned absolutely within the card */}
        {hasSubtopics && (
          <button
            onClick={handleExpandClick}
            className="absolute right-2 top-2 bg-white/20 hover:bg-white/30 text-white rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-white z-10 transition-transform duration-200 ease-in-out"
            aria-label={isExpanded ? 'Collapse subtopics' : 'Expand subtopics'}
            title={isExpanded ? 'Collapse subtopics' : 'Expand subtopics'}
          >
            {isExpanded ? (
              <MinusCircleIcon className="h-5 w-5" />
            ) : (
              <PlusCircleIcon className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      {/* Handles for edges */}
      <Handle
        type="source"
        position={Position.Right}
        id={`${topic.id}-source`}
        isConnectable={isConnectable}
        className="!bg-gray-400 !w-2.5 !h-2.5 !border-2 !border-white"
        style={{ right: -5 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id={`${topic.id}-target`}
        isConnectable={isConnectable}
        className="!bg-gray-400 !w-2.5 !h-2.5 !border-2 !border-white"
        style={{ left: -5 }}
      />
    </div>
  );
};

export default memo(ModernTopicNode);