import { Injectable, signal } from '@angular/core';
import { forkJoin, catchError, of } from 'rxjs';
import { CanvasNode, CanvasEdge, CanvasViewport, PendingConnection, NodeCategory } from './canvas.models';

const NODE_SELECTOR_ICONS: { [nodeType: string]: string } = {
  ask: 'database', basic_ask: 'database', advanced_ask: 'database',
  brave: 'globe', context_conditional: 'dataflow', cypher: 'file-code',
  external: 'globe', generate: 'generator', google: 'globe',
  historical: 'history', internet: 'globe', mcp: 'file',
  perplexity: 'globe', post_conditional: 'dataflow', postprocess_alinia: 'shield-check',
  pre_conditional: 'dataflow', preprocess_alinia: 'shield-check',
  remi: 'validation', rephrase: 'rephrase', restart: 'repeat',
  restricted: 'file-code', sql: 'file-code', summarize: 'summary',
  tavily: 'globe', static: 'file', marklogic: 'database', sync: 'database',
};

const CATEGORY_X: Record<string, number> = {
  preprocess: 350,
  context: 700,
  generation: 1050,
  postprocess: 1400,
};

const NODE_WIDTH = 220;
const NODE_HEIGHT = 100;
const NODE_VERTICAL_GAP = 180;

@Injectable({ providedIn: 'root' })
export class CanvasService {
  nodes = signal<CanvasNode[]>([]);
  edges = signal<CanvasEdge[]>([]);
  selectedNodeId = signal<string | null>(null);
  selectedEdgeId = signal<string | null>(null);
  pendingConnection = signal<PendingConnection | null>(null);
  viewport = signal<CanvasViewport>({ x: 50, y: 50, scale: 1 });
  loading = signal<boolean>(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loadFromArag(arag: any, aragSlug?: string): void {
    this.loading.set(true);
    forkJoin({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      preprocess: (arag.getPreprocess() as any).pipe(catchError(() => of([]))),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      context: (arag.getContext() as any).pipe(catchError(() => of([]))),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      generation: (arag.getGeneration() as any).pipe(catchError(() => of([]))),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      postprocess: (arag.getPostprocess() as any).pipe(catchError(() => of([]))),
    }).subscribe(({ preprocess, context, generation, postprocess }) => {
      const savedPositions = aragSlug ? this.loadPositions(aragSlug) : {};

      const nodes: CanvasNode[] = [];
      const edges: CanvasEdge[] = [];

      // Root node
      const rootNode: CanvasNode = {
        id: 'root',
        agentIndex: -1,
        x: savedPositions['root']?.x ?? 60,
        y: savedPositions['root']?.y ?? 300,
        width: 160,
        height: 80,
        type: 'root',
        category: 'root',
        title: 'Pipeline Start',
        icon: 'circle',
        isRoot: true,
      };
      nodes.push(rootNode);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const categories: { name: NodeCategory; agents: any[] }[] = [
        { name: 'preprocess', agents: preprocess as any[] },
        { name: 'context', agents: context as any[] },
        { name: 'generation', agents: generation as any[] },
        { name: 'postprocess', agents: postprocess as any[] },
      ];

      const categoryNodes: Record<string, CanvasNode[]> = {};

      for (const { name, agents } of categories) {
        const catNodes: CanvasNode[] = [];
        const x = CATEGORY_X[name];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        agents.forEach((agent: any, idx: number) => {
          const id = `${name}-${idx}`;
          const title = agent.module.charAt(0).toUpperCase() + agent.module.slice(1).replace(/_/g, ' ');
          const icon = NODE_SELECTOR_ICONS[agent.module] || 'circle';
          const defaultY = 300 + (idx - (agents.length - 1) / 2) * NODE_VERTICAL_GAP;
          catNodes.push({
            id,
            agentIndex: idx,
            x: savedPositions[id]?.x ?? x,
            y: savedPositions[id]?.y ?? defaultY,
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
            type: agent.module,
            category: name,
            title,
            icon,
          });
        });
        categoryNodes[name] = catNodes;
        nodes.push(...catNodes);

        // Sequential edges within category
        for (let i = 0; i < catNodes.length - 1; i++) {
          edges.push({
            id: `edge-${catNodes[i].id}-${catNodes[i + 1].id}`,
            sourceNodeId: catNodes[i].id,
            targetNodeId: catNodes[i + 1].id,
          });
        }
      }

      // Root → first node of each non-empty category
      for (const { name } of categories) {
        const catNodes = categoryNodes[name];
        if (catNodes && catNodes.length > 0) {
          edges.push({
            id: `edge-root-${catNodes[0].id}`,
            sourceNodeId: 'root',
            targetNodeId: catNodes[0].id,
          });
        }
      }

      // Between categories: last of prev → first of next
      const nonEmptyCategories = categories.filter(({ name }) => categoryNodes[name]?.length > 0);
      for (let i = 0; i < nonEmptyCategories.length - 1; i++) {
        const prevCat = nonEmptyCategories[i].name;
        const nextCat = nonEmptyCategories[i + 1].name;
        const prevNodes = categoryNodes[prevCat];
        const nextNodes = categoryNodes[nextCat];
        if (prevNodes?.length && nextNodes?.length) {
          edges.push({
            id: `edge-${prevNodes[prevNodes.length - 1].id}-${nextNodes[0].id}`,
            sourceNodeId: prevNodes[prevNodes.length - 1].id,
            targetNodeId: nextNodes[0].id,
          });
        }
      }

      this.nodes.set(nodes);
      this.edges.set(edges);
      this.loading.set(false);
    });
  }

  moveNode(id: string, dx: number, dy: number): void {
    this.nodes.update(nodes =>
      nodes.map(n => n.id === id ? { ...n, x: n.x + dx, y: n.y + dy } : n)
    );
  }

  setNodePosition(id: string, x: number, y: number): void {
    this.nodes.update(nodes =>
      nodes.map(n => n.id === id ? { ...n, x, y } : n)
    );
  }

  addEdge(sourceNodeId: string, targetNodeId: string): void {
    const id = `edge-${sourceNodeId}-${targetNodeId}-${Date.now()}`;
    this.edges.update(edges => [...edges, { id, sourceNodeId, targetNodeId }]);
  }

  removeEdge(id: string): void {
    this.edges.update(edges => edges.filter(e => e.id !== id));
  }

  selectNode(id: string | null): void {
    this.selectedNodeId.set(id);
    this.selectedEdgeId.set(null);
  }

  selectEdge(id: string | null): void {
    this.selectedEdgeId.set(id);
    this.selectedNodeId.set(null);
  }

  startConnection(sourceNodeId: string): void {
    const node = this.nodes().find(n => n.id === sourceNodeId);
    if (!node) return;
    this.pendingConnection.set({
      sourceNodeId,
      currentX: node.x + node.width,
      currentY: node.y + node.height / 2,
    });
  }

  updatePendingConnection(x: number, y: number): void {
    const pending = this.pendingConnection();
    if (!pending) return;
    this.pendingConnection.set({ ...pending, currentX: x, currentY: y });
  }

  cancelConnection(): void {
    this.pendingConnection.set(null);
  }

  finishConnection(targetNodeId: string): void {
    const pending = this.pendingConnection();
    if (!pending) return;
    this.addEdge(pending.sourceNodeId, targetNodeId);
    this.pendingConnection.set(null);
  }

  savePositions(aragSlug: string): void {
    const positions: Record<string, { x: number; y: number }> = {};
    for (const node of this.nodes()) {
      positions[node.id] = { x: node.x, y: node.y };
    }
    localStorage.setItem(`canvas-positions-${aragSlug}`, JSON.stringify(positions));
  }

  loadPositions(aragSlug: string): Record<string, { x: number; y: number }> {
    try {
      const stored = localStorage.getItem(`canvas-positions-${aragSlug}`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }
}
