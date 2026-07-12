'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force';
import {
  ControlButton,
  Controls,
  Handle,
  Position,
  ReactFlow,
  useReactFlow,
  type Edge,
  type Node,
  type NodeOrigin,
  type NodeProps,
} from '@xyflow/react';
import {
  Focus,
  Maximize2,
  Minimize2,
  Network,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

import type {Chat, ContextGraph, RelevanceTier} from '@/lib/context';

export type ContextGraphPanelProps = {
  graph: ContextGraph;
  chats: Chat[];
  viewedChatId: string | null;
  isExpanded: boolean;
  isOpen: boolean;
  onNodeSelect: (chatId: string | null) => void;
  onExpandedChange: (expanded: boolean) => void;
  onClose: () => void;
};

type ContextNodeData = {
  chatId: string | null;
  kind: 'current' | 'related';
  label: string;
  relevanceTier?: RelevanceTier;
  isDimmed: boolean;
  onSelect: (chatId: string | null) => void;
};

type ContextFlowNode = Node<ContextNodeData, 'knowledgeNode'>;

type ForceNode = SimulationNodeDatum & {
  id: string;
  kind: 'current' | 'related';
};

type ForceLink = SimulationLinkDatum<ForceNode> & {
  id: string;
  source: string | ForceNode;
  target: string | ForceNode;
  kind: 'current' | 'related';
};

type GraphPosition = {x: number; y: number};

const MAX_RELATED_NODES = 5;
const NODE_WIDTH = 128;
const RELATED_NODE_HEIGHT = 68;
const CURRENT_NODE_HEIGHT = 72;
const NODE_ORIGIN: NodeOrigin = [0.5, 0.5];
const FIT_VIEW_OPTIONS = {padding: 0.12, maxZoom: 1.35};
const PRO_OPTIONS = {hideAttribution: true};

const tierLabels: Record<RelevanceTier, string> = {
  high: '높은 관련성',
  medium: '관련 있음',
  low: '참고 가능',
};

const joinClassNames = (...classNames: Array<string | false | undefined>) =>
  classNames.filter(Boolean).join(' ');

const getForceNodeId = (node: string | ForceNode) =>
  typeof node === 'string' ? node : node.id;

function KnowledgeNode({data, selected}: NodeProps<ContextFlowNode>) {
  const isCurrent = data.kind === 'current';
  const relevanceLabel = data.relevanceTier
    ? tierLabels[data.relevanceTier]
    : undefined;

  return (
    <>
      {isCurrent ? (
        <Handle
          id="current-source"
          type="source"
          position={Position.Top}
          isConnectable={false}
          className="knowledgeNodeHandle"
        />
      ) : (
        <>
          <Handle
            id="peer-source"
            type="source"
            position={Position.Top}
            isConnectable={false}
            className="knowledgeNodeHandle"
          />
          <Handle
            id="related-target"
            type="target"
            position={Position.Top}
            isConnectable={false}
            className="knowledgeNodeHandle"
          />
        </>
      )}
      <button
        type="button"
        className={joinClassNames(
          'knowledgeNodeButton',
          'nodrag',
          'nopan',
          isCurrent ? 'knowledgeNodeCurrent' : 'knowledgeNodeRelated',
          data.relevanceTier && `knowledgeNode-${data.relevanceTier}`,
          selected && 'knowledgeNodeSelected',
          data.isDimmed && 'knowledgeNodeDimmed',
        )}
        aria-label={
          isCurrent
            ? undefined
            : [
                `${data.label} 대화 열기`,
                relevanceLabel,
                selected ? '보고 있음' : undefined,
              ]
                .filter(Boolean)
                .join(', ')
        }
        aria-pressed={selected}
        title={relevanceLabel ? `${data.label} · ${relevanceLabel}` : data.label}
        onClick={(event) => {
          event.stopPropagation();
          data.onSelect(data.chatId);
        }}>
        <span className="knowledgeNodeMarker" aria-hidden="true" />
        <span className="knowledgeNodeLabel">{data.label}</span>
        {selected ? <span className="knowledgeNodeState">보고 있음</span> : null}
      </button>
    </>
  );
}

const NODE_TYPES = {knowledgeNode: KnowledgeNode};

function GraphViewportSync({syncKey}: {syncKey: string}) {
  const {fitView} = useReactFlow<ContextFlowNode, Edge>();

  useEffect(() => {
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        void fitView({...FIT_VIEW_OPTIONS, duration: 180});
      });
    });

    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [fitView, syncKey]);

  return null;
}

function ContextGraphControls() {
  const {fitView, zoomIn, zoomOut} = useReactFlow<ContextFlowNode, Edge>();

  return (
    <Controls
      className="contextGraphControls"
      aria-label="그래프 보기 조절"
      showZoom={false}
      showFitView={false}
      showInteractive={false}>
      <ControlButton type="button" aria-label="그래프 확대" title="그래프 확대" onClick={() => void zoomIn()}>
        <ZoomIn aria-hidden="true" />
      </ControlButton>
      <ControlButton type="button" aria-label="그래프 축소" title="그래프 축소" onClick={() => void zoomOut()}>
        <ZoomOut aria-hidden="true" />
      </ControlButton>
      <ControlButton
        type="button"
        aria-label="그래프 전체 보기"
        title="그래프 전체 보기"
        onClick={() => void fitView(FIT_VIEW_OPTIONS)}>
        <Focus aria-hidden="true" />
      </ControlButton>
    </Controls>
  );
}

export function ContextGraphPanel({
  graph,
  chats,
  viewedChatId,
  isExpanded,
  isOpen,
  onNodeSelect,
  onExpandedChange,
  onClose,
}: ContextGraphPanelProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<Record<string, GraphPosition>>({});
  const [layoutRevision, setLayoutRevision] = useState(0);
  const [isCanvasReady, setIsCanvasReady] = useState(false);

  const graphModel = useMemo(() => {
    const currentNode = graph.nodes.find((node) => node.type === 'current') ?? {
      id: 'current',
      chatId: null,
      label: '새 대화',
      type: 'current' as const,
    };
    const currentNodeId = currentNode.id;
    const relatedNodes = graph.nodes
      .filter((node) => node.type === 'past')
      .slice(0, MAX_RELATED_NODES);
    const visibleNodeIds = new Set([
      currentNodeId,
      ...relatedNodes.map((node) => node.id),
    ]);
    const links = graph.edges.filter(
      (edge) =>
        visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target),
    );

    return {currentNode, currentNodeId, relatedNodes, links};
  }, [graph]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!isOpen || !canvas) {
      setIsCanvasReady(false);
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const {width, height} = entry.contentRect;
      setIsCanvasReady(width > 8 && height > 8);
    });
    observer.observe(canvas);

    return () => observer.disconnect();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const forceNodes: ForceNode[] = [
      {
        id: graphModel.currentNodeId,
        kind: 'current',
        x: 0,
        y: 0,
        fx: 0,
        fy: 0,
      },
      ...graphModel.relatedNodes.map<ForceNode>((node, index) => {
        const angle =
          -Math.PI / 2 +
          (index * Math.PI * 2) / Math.max(1, graphModel.relatedNodes.length);
        const radius = isExpanded ? 260 : 124;

        return {
          id: node.id,
          kind: 'related',
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
        };
      }),
    ];
    const forceLinks: ForceLink[] = graphModel.links.map((link) => ({
      id: link.id,
      source: link.source,
      target: link.target,
      kind: link.kind,
    }));
    const linkDistance = isExpanded ? 250 : 118;
    const simulation = forceSimulation<ForceNode>(forceNodes)
      .force(
        'link',
        forceLink<ForceNode, ForceLink>(forceLinks)
          .id((node) => node.id)
          .distance((link) =>
            link.kind === 'related'
              ? isExpanded
                ? 190
                : 92
              : linkDistance,
          )
          .strength((link) => (link.kind === 'related' ? 0.32 : 0.82)),
      )
      .force(
        'charge',
        forceManyBody<ForceNode>().strength(isExpanded ? -320 : -55),
      )
      .force('center', forceCenter(0, 0).strength(0.05))
      .force(
        'collide',
        forceCollide<ForceNode>()
          .radius(isExpanded ? 102 : 64)
          .strength(0.92),
      )
      .alphaDecay(0.085)
      .velocityDecay(0.46);
    let animationFrame = 0;
    let hasPublishedFirstTick = false;

    const publishPositions = () => {
      if (animationFrame) {
        return;
      }

      animationFrame = requestAnimationFrame(() => {
        animationFrame = 0;
        setPositions(
          Object.fromEntries(
            forceNodes.map((node) => [
              node.id,
              {x: node.x ?? 0, y: node.y ?? 0},
            ]),
          ),
        );

        if (!hasPublishedFirstTick) {
          hasPublishedFirstTick = true;
          setLayoutRevision((revision) => revision + 1);
        }
      });
    };

    simulation
      .on('tick', publishPositions)
      .on('end', () => {
        publishPositions();
        setLayoutRevision((revision) => revision + 1);
      });
    publishPositions();

    return () => {
      simulation.stop();
      cancelAnimationFrame(animationFrame);
    };
  }, [graphModel, isExpanded, isOpen]);

  const nodes = useMemo<ContextFlowNode[]>(
    () => [
      {
        id: graphModel.currentNodeId,
        type: 'knowledgeNode',
        position: positions[graphModel.currentNodeId] ?? {x: 0, y: 0},
        initialWidth: NODE_WIDTH,
        initialHeight: CURRENT_NODE_HEIGHT,
        selected: true,
        draggable: false,
        connectable: false,
        selectable: true,
        focusable: false,
        ariaRole: 'presentation',
        className: 'knowledgeFlowNode knowledgeFlowNodeCurrent',
        data: {
          chatId: graphModel.currentNode.chatId,
          kind: 'current',
          label: graphModel.currentNode.label,
          isDimmed: false,
          onSelect: onNodeSelect,
        },
      },
      ...graphModel.relatedNodes.map<ContextFlowNode>((node) => ({
        id: node.id,
        type: 'knowledgeNode',
        position: positions[node.id] ?? {x: 0, y: 0},
        initialWidth: NODE_WIDTH,
        initialHeight: RELATED_NODE_HEIGHT,
        selected: false,
        draggable: false,
        connectable: false,
        selectable: true,
        focusable: false,
        ariaRole: 'presentation',
        className: 'knowledgeFlowNode knowledgeFlowNodeRelated',
        data: {
          chatId: node.chatId,
          kind: 'related',
          label: node.label,
          relevanceTier: node.relevanceTier,
          isDimmed: false,
          onSelect: onNodeSelect,
        },
      })),
    ],
    [graphModel, onNodeSelect, positions],
  );
  const edges = useMemo<Edge[]>(
    () =>
      graphModel.links.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle:
          edge.kind === 'current' ? 'current-source' : 'peer-source',
        targetHandle: 'related-target',
        type: 'straight',
        selectable: false,
        focusable: false,
        className: joinClassNames(
          'knowledgeGraphEdge',
          'knowledgeGraphEdgeActive',
          edge.kind === 'related' && 'knowledgeGraphEdgePeer',
        ),
        ariaLabel: edge.reason,
      })),
    [graphModel],
  );

  if (!isOpen) {
    return null;
  }

  const viewedChat = viewedChatId
    ? chats.find((chat) => chat.id === viewedChatId)
    : undefined;

  return (
    <aside
      className={joinClassNames(
        'contextGraphPanel',
        isExpanded
          ? 'contextGraphPanelExpanded'
          : 'contextGraphPanelCollapsed',
      )}
      aria-label="컨텍스트 그래프">
      <header className="contextGraphPanelHeader">
        <div className="contextGraphPanelTitleGroup">
          <Network className="contextGraphPanelTitleIcon" aria-hidden="true" />
          <div>
            <h2 className="contextGraphPanelTitle">컨텍스트 그래프</h2>
            <p className="contextGraphPanelSubtitle">
              보고 있는 대화 기준 · 연결 {graphModel.relatedNodes.length}개
            </p>
          </div>
        </div>

        <div className="contextGraphPanelActions">
          <button
            type="button"
            className="contextGraphPanelAction contextGraphPanelDesktopAction"
            aria-label={isExpanded ? '컨텍스트 그래프 축소' : '컨텍스트 그래프 확대'}
            aria-pressed={isExpanded}
            onClick={() => onExpandedChange(!isExpanded)}>
            {isExpanded ? (
              <Minimize2 className="contextGraphPanelActionIcon" aria-hidden="true" />
            ) : (
              <Maximize2 className="contextGraphPanelActionIcon" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className="contextGraphPanelAction contextGraphPanelMobileAction"
            aria-label="컨텍스트 그래프 닫기"
            onClick={onClose}>
            <X className="contextGraphPanelActionIcon" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="contextGraphPanelCanvas" ref={canvasRef}>
        {isCanvasReady ? (
          <ReactFlow<ContextFlowNode, Edge>
            nodes={nodes}
            edges={edges}
            nodeTypes={NODE_TYPES}
            nodeOrigin={NODE_ORIGIN}
            fitView
            fitViewOptions={FIT_VIEW_OPTIONS}
            minZoom={0.5}
            maxZoom={2.2}
            nodesDraggable={false}
            nodesConnectable={false}
            nodesFocusable={false}
            edgesFocusable={false}
            elementsSelectable
            panOnDrag
            zoomOnScroll
            zoomOnPinch
            zoomOnDoubleClick={false}
            preventScrolling
            proOptions={PRO_OPTIONS}
            aria-label="보고 있는 대화와 관련 대화의 로컬 지식 그래프">
            <GraphViewportSync
              syncKey={`${layoutRevision}-${isExpanded}-${graphModel.currentNodeId}`}
            />
            <ContextGraphControls />
          </ReactFlow>
        ) : null}

        {graphModel.relatedNodes.length === 0 ? (
          <p className="contextGraphEmpty">이 대화와 연결된 대화가 아직 없습니다.</p>
        ) : null}
      </div>

      {viewedChat ? (
        <footer className="contextGraphPanelFooter" aria-live="polite" aria-atomic="true">
          <div className="contextGraphPanelFooterHeading">
            <span className="contextGraphPanelFooterEyebrow">그래프 기준 대화</span>
            <h3 className="contextGraphPanelFooterTitle">{viewedChat.title}</h3>
            <time className="contextGraphPanelFooterDate" dateTime={viewedChat.date}>
              {viewedChat.date}
            </time>
          </div>
          <div className="contextGraphPanelRelationship">
            <span className="contextGraphPanelRelationshipLabel">대화 요약</span>
            <p className="contextGraphPanelRelationshipReason">
              {viewedChat.summary}
            </p>
          </div>
        </footer>
      ) : null}
    </aside>
  );
}
