export type NodeCategory = 'preprocess' | 'context' | 'generation' | 'postprocess' | 'root';

export interface CanvasNode {
  id: string;
  agentIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  category: NodeCategory;
  title: string;
  icon: string;
  isRoot?: boolean;
}

export interface CanvasEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
}

export interface CanvasViewport {
  x: number;
  y: number;
  scale: number;
}

export interface PendingConnection {
  sourceNodeId: string;
  currentX: number;
  currentY: number;
}
