'use client';

import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  MarkerType,
  Position,
  NodeOrigin,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Topic as TopicType } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import ELK, { ElkNode, ElkExtendedEdge, LayoutOptions } from 'elkjs/lib/elk.bundled.js';

import ModernTopicNode from './ModernTopicNode';
import ModernSubtopicNode from './ModernSubtopicNode';

const elk = new ELK();

const elkLayoutOptions: LayoutOptions = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'elk.layered.spacing.nodeNodeBetweenLayers': '160', // Increased spacing for better visual separation
  'elk.spacing.nodeNode': '100', // Spacing between subtopics or topics in same layer
  'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF', // Different strategy, can look good
  'elk.layered.cycleBreaking.strategy': 'DEPTH_FIRST',
  'elk.edgeRouting': 'SPLINES', // Smoother edges
  'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
  'elk.padding.node': '[top=25,left=25,bottom=25,right=25]',
};

interface MindMapProps {
  topics: TopicType[];
}

const nodeOrigin: NodeOrigin = [0.5, 0.5];
const ESTIMATED_MAIN_NODE_WIDTH = 250; // Adjust based on ModernTopicNode's typical rendered width
const ESTIMATED_MAIN_NODE_HEIGHT = 90;  // Adjust
const ESTIMATED_SUB_NODE_WIDTH = 220;  // Adjust based on ModernSubtopicNode
const ESTIMATED_SUB_NODE_HEIGHT = 70; // Adjust

const nodeTypes = {
  modernTopic: ModernTopicNode,
  modernSubtopic: ModernSubtopicNode,
};

const getLayoutedElements = async (
  topicsData: TopicType[],
  expandedTopics: Set<string>,
  onToggleExpandForNode: (topicId: string) => void,
  layoutOptionsToUse: LayoutOptions
): Promise<{ layoutedNodes: Node[]; layoutedEdges: Edge[] }> => {
  const elkNodes: ElkNode[] = [];
  const elkEdges: ElkExtendedEdge[] = [];
  const visibleNodeIds = new Set<string>();

  topicsData.forEach((topic) => {
    const topicNodeId = `topic-${topic.id}`;
    elkNodes.push({
      id: topicNodeId,
      width: ESTIMATED_MAIN_NODE_WIDTH,
      height: ESTIMATED_MAIN_NODE_HEIGHT,
    });
    visibleNodeIds.add(topicNodeId);

    if (expandedTopics.has(topic.id) && topic.subtopics) {
      topic.subtopics.forEach((subtopic) => {
        const subtopicNodeId = `subtopic-${topic.id}-${subtopic.id}`;
        elkNodes.push({
          id: subtopicNodeId,
          width: ESTIMATED_SUB_NODE_WIDTH,
          height: ESTIMATED_SUB_NODE_HEIGHT,
        });
        visibleNodeIds.add(subtopicNodeId);
        elkEdges.push({
          id: `edge-${topicNodeId}-${subtopicNodeId}`,
          sources: [topicNodeId],
          targets: [subtopicNodeId],
        });
      });
    }
  });

  const filteredElkNodes = elkNodes.filter(node => visibleNodeIds.has(node.id));
  const filteredElkEdges = elkEdges.filter(edge => visibleNodeIds.has(edge.sources[0]) && visibleNodeIds.has(edge.targets[0]));

  const graphToLayout: ElkNode = {
    id: 'root',
    layoutOptions: layoutOptionsToUse,
    children: filteredElkNodes,
    edges: filteredElkEdges,
  };

  try {
    const layoutedGraph = await elk.layout(graphToLayout);
    const reactFlowNodes: Node[] = (layoutedGraph.children || []).map((elkNode: ElkNode) => {
      const isTopicNode = elkNode.id.startsWith('topic-');
      const originalTopic = isTopicNode ? topicsData.find(t => `topic-${t.id}` === elkNode.id) : null;
      const originalSubtopicInfo = !isTopicNode ? topicsData.reduce((acc, t) => {
        const st = t.subtopics.find(s => `subtopic-${t.id}-${s.id}` === elkNode.id);
        if (st) acc = { subtopic: st, parentTopic: t };
        return acc;
      }, null as { subtopic: any, parentTopic: TopicType } | null) : null;

      let nodeData: any = {};
      let nodeTypeIdentifier: string = 'default';

      if (originalTopic) {
        nodeTypeIdentifier = 'modernTopic';
        nodeData = {
          label: originalTopic.title,
          topic: originalTopic,
          isExpanded: expandedTopics.has(originalTopic.id),
          hasSubtopics: originalTopic.subtopics && originalTopic.subtopics.length > 0,
          onToggleExpand: () => onToggleExpandForNode(originalTopic.id),
        };
      } else if (originalSubtopicInfo) {
        nodeTypeIdentifier = 'modernSubtopic';
        nodeData = {
          label: originalSubtopicInfo.subtopic.title,
          topicId: originalSubtopicInfo.parentTopic.id, // For navigation
          subtopic: originalSubtopicInfo.subtopic,
          parentColor: originalSubtopicInfo.parentTopic.color,
        };
      }

      return {
        id: elkNode.id, type: nodeTypeIdentifier, data: nodeData,
        position: { x: elkNode.x || 0, y: elkNode.y || 0 },
        nodeOrigin: nodeOrigin,
      };
    });

    const reactFlowEdges: Edge[] = (layoutedGraph.edges || []).map((elkEdge: ElkExtendedEdge) => {
      const sourceNodeId = elkEdge.sources[0];
      const sourceTopicId = sourceNodeId.startsWith('topic-') ? sourceNodeId.replace('topic-', '') : null;
      const parentTopic = sourceTopicId ? topicsData.find(t => t.id === sourceTopicId) : null;
      const strokeColor = parentTopic?.color || '#94a3b8';

      return {
        id: elkEdge.id, source: sourceNodeId, target: elkEdge.targets[0],
        type: 'smoothstep',
        animated: false,
        markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor, width: 18, height: 18 },
        style: { stroke: strokeColor, strokeWidth: 2.5 },
      };
    });
    return { layoutedNodes: reactFlowNodes, layoutedEdges: reactFlowEdges };
  } catch (error) {
    console.error('ELK layout error:', error);
    return { layoutedNodes: [], layoutedEdges: [] };
  }
};

function MindMapContent({ topics }: MindMapProps) {
  const router = useRouter();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLaidOut, setIsLaidOut] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const { fitView } = useReactFlow();

  const handleToggleExpand = useCallback((topicId: string) => {
    setExpandedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) newSet.delete(topicId);
      else newSet.add(topicId);
      return newSet;
    });
  }, []);

  const updateLayout = useCallback(() => {
    setIsLaidOut(false);
    getLayoutedElements(topics, expandedTopics, handleToggleExpand, elkLayoutOptions)
      .then(({ layoutedNodes, layoutedEdges }) => {
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        setIsLaidOut(true);
      })
      .catch(error => {
        console.error("Failed to get layouted elements:", error);
        setIsLaidOut(true);
      });
  }, [topics, expandedTopics, handleToggleExpand]);

  useEffect(() => {
    updateLayout();
  }, [updateLayout]); // updateLayout includes topics, expandedTopics, handleToggleExpand

  useEffect(() => {
    if (isLaidOut && nodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.25, duration: 600 });
      }, 150); // Increased delay slightly for complex renders
      return () => clearTimeout(timer);
    }
  }, [isLaidOut, nodes, fitView]);

  const onNodesChange: OnNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange: OnEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      // Navigation is triggered by clicking the main body of the node.
      // The expand/collapse button within ModernTopicNode has its own onClick with stopPropagation.
      const { topicId, subtopic } = node.data as any; // Using 'any' for simplicity here, ensure data types in nodes

      if (topicId && subtopic?.id) { // Clicked on a subtopic node
        router.push(`/chat/${topicId}?subtopic=${subtopic.id}`);
      } else if (topicId) { // Clicked on a main topic node
        router.push(`/chat/${topicId}`);
      }
    },
    [router]
  );

  if (!isLaidOut && topics.length > 0) {
    return <div className="flex justify-center items-center h-full min-h-[500px] text-gray-500">Generating map layout...</div>;
  }

  return (
    <div style={{ height: 'calc(100vh - 100px)', minHeight: '500px', width: '100%', borderRadius: '0.5rem', background: '#f8fafc' /* slate-50 */ }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2, duration: 800 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        zoomOnScroll={true}
        zoomOnDoubleClick={true}
        minZoom={0.3}
        maxZoom={2}
      >
        <Controls showInteractive={false} /> {/* Hiding interactive control for cleaner look */}
        <Background variant="dots" gap={20} size={0.7} color="#d1d5db" /> {/* gray-300 */}
      </ReactFlow>
    </div>
  );
}

export default function MindMap(props: MindMapProps) {
  return (
    <ReactFlowProvider>
      <MindMapContent {...props} />
    </ReactFlowProvider>
  );
}