import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { CanvasEdge, CanvasNode, CanvasViewport, PendingConnection } from '../canvas.models';

const CATEGORY_COLORS: Record<string, string> = {
  preprocess: '#7b61ff',
  context: '#0ea5e9',
  generation: '#10b981',
  postprocess: '#f59e0b',
  root: '#64748b',
};

@Component({
  selector: 'app-canvas-edges',
  standalone: true,
  imports: [],
  template: `
    <svg class="edges-svg" [attr.width]="'100%'" [attr.height]="'100%'">
      @for (edge of edges(); track edge.id) {
        <g>
          <!-- Wide transparent hit area for easy clicking -->
          <path
            [attr.d]="getEdgePath(edge)"
            stroke="transparent"
            stroke-width="12"
            fill="none"
            style="pointer-events: stroke; cursor: pointer;"
            (click)="onEdgeClick(edge.id, $event)" />
          <!-- Visual edge path -->
          <path
            [attr.d]="getEdgePath(edge)"
            [attr.stroke]="getEdgeColor(edge)"
            [class.edge-selected]="edge.id === selectedEdgeId()"
            class="edge-path"
            stroke-width="2"
            fill="none"
            style="pointer-events: none;" />
        </g>
      }
      @if (pendingConnection()) {
        <path
          [attr.d]="getPendingPath()"
          class="edge-path edge-pending"
          stroke="#93c5fd"
          stroke-width="2"
          fill="none"
          stroke-dasharray="6 3"
          style="pointer-events: none;" />
      }
    </svg>
  `,
  styleUrl: './canvas-edges.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasEdgesComponent {
  nodes = input.required<CanvasNode[]>();
  edges = input.required<CanvasEdge[]>();
  selectedEdgeId = input<string | null>(null);
  pendingConnection = input<PendingConnection | null>(null);
  viewport = input.required<CanvasViewport>();

  edgeClicked = output<string>();

  private toSvg(worldX: number, worldY: number): { x: number; y: number } {
    const vp = this.viewport();
    return {
      x: worldX * vp.scale + vp.x,
      y: worldY * vp.scale + vp.y,
    };
  }

  getEdgePath(edge: CanvasEdge): string {
    const nodes = this.nodes();
    const src = nodes.find(n => n.id === edge.sourceNodeId);
    const tgt = nodes.find(n => n.id === edge.targetNodeId);
    if (!src || !tgt) return '';

    const srcWorld = { x: src.x + src.width, y: src.y + src.height / 2 };
    const tgtWorld = { x: tgt.x, y: tgt.y + tgt.height / 2 };

    const s = this.toSvg(srcWorld.x, srcWorld.y);
    const t = this.toSvg(tgtWorld.x, tgtWorld.y);
    const cp = 100 * this.viewport().scale;

    return `M ${s.x} ${s.y} C ${s.x + cp} ${s.y} ${t.x - cp} ${t.y} ${t.x} ${t.y}`;
  }

  getPendingPath(): string {
    const pending = this.pendingConnection();
    if (!pending) return '';

    const nodes = this.nodes();
    const src = nodes.find(n => n.id === pending.sourceNodeId);
    if (!src) return '';

    const srcWorld = { x: src.x + src.width, y: src.y + src.height / 2 };
    const s = this.toSvg(srcWorld.x, srcWorld.y);
    const t = this.toSvg(pending.currentX, pending.currentY);
    const cp = 80 * this.viewport().scale;

    return `M ${s.x} ${s.y} C ${s.x + cp} ${s.y} ${t.x - cp} ${t.y} ${t.x} ${t.y}`;
  }

  getEdgeColor(edge: CanvasEdge): string {
    const src = this.nodes().find(n => n.id === edge.sourceNodeId);
    return CATEGORY_COLORS[src?.category ?? ''] ?? '#64748b';
  }

  onEdgeClick(edgeId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.edgeClicked.emit(edgeId);
  }
}
