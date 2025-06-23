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
  NodeOrigin,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant,
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
  'elk.direction': 'DOWN', // Changed to DOWN for vertical layout
  'elk.layered.spacing.nodeNodeBetweenLayers': '120', // Adjusted spacing for vertical
  'elk.spacing.nodeNode': '80', // Adjusted spacing for vertical
  'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
  'elk.layered.cycleBreaking.strategy': 'DEPTH_FIRST',
  'elk.edgeRouting': 'SPLINES',
  'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
  'elk.padding.node': '[top=25,left=25,bottom=25,right=25]',
};

interface MindMapProps {
  topics: TopicType[];
}

const nodeOrigin: NodeOrigin = [0.5, 0.5];
const ESTIMATED_MAIN_NODE_WIDTH = 361;
const ESTIMATED_MAIN_NODE_HEIGHT = 160;
const ESTIMATED_SUB_NODE_WIDTH = 240;
const ESTIMATED_SUB_NODE_HEIGHT = 100;

const nodeTypes = {
  modernTopic: ModernTopicNode,
  modernSubtopic: ModernSubtopicNode,
};

const getLayoutedElements = async (
  topicsData: TopicType[],
  layoutOptionsToUse: LayoutOptions
): Promise<{ layoutedNodes: Node[]; layoutedEdges: Edge[] }> => {
  const elkNodes: ElkNode[] = [];
  const elkEdges: ElkExtendedEdge[] = [];
  const visibleNodeIds = new Set<string>();

  // All topics with subtopics are now considered expanded by default.
  const expandedTopics = new Set(topicsData.filter(t => t.subtopics?.length > 0).map(t => t.id));

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
        };
      } else if (originalSubtopicInfo) {
        nodeTypeIdentifier = 'modernSubtopic';
        nodeData = {
          label: originalSubtopicInfo.subtopic.title,
          topicId: originalSubtopicInfo.parentTopic.id,
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
  const { fitView } = useReactFlow();

  const updateLayout = useCallback(() => {
    setIsLaidOut(false);
    getLayoutedElements(topics, elkLayoutOptions)
      .then(({ layoutedNodes, layoutedEdges }) => {
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        setIsLaidOut(true);
      })
      .catch(error => {
        console.error("Failed to get layouted elements:", error);
        setIsLaidOut(true);
      });
  }, [topics]);

  useEffect(() => {
    updateLayout();
  }, [updateLayout]);

  useEffect(() => {
    if (isLaidOut && nodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.2, duration: 600 });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isLaidOut, nodes, fitView]);

  const onNodesChange: OnNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange: OnEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const topicData = node.data.topic;
      const subtopicData = node.data.subtopic;
      const topicId = node.data.topicId || topicData?.id;

      if (subtopicData?.id) {
        router.push(`/chat/${topicId}?subtopic=${subtopicData.id}`);
      } else if (topicId) {
        router.push(`/chat/${topicId}`);
      }
    },
    [router]
  );

  if (!isLaidOut && topics.length > 0) {
    return <div className="flex justify-center items-center h-full min-h-[500px] text-gray-500">Generating map layout...</div>;
  }

  return (
    <div style={{ height: 'calc(100vh - 100px)', minHeight: '500px', width: '100%', borderRadius: '0.5rem', background: '#f8fafc' }}>
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
        <Controls showInteractive={false} />
        <Background variant={BackgroundVariant.Dots} gap={20} size={0.7} color="#d1d5db" />
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