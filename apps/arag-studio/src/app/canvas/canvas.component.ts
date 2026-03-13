import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { SDKService } from '@flaps/core';
import { CanvasService } from './canvas.service';
import { CanvasLayoutService } from './canvas-layout.service';
import { CanvasNodeComponent } from './canvas-node/canvas-node.component';
import { CanvasEdgesComponent } from './canvas-edges/canvas-edges.component';
import { CanvasToolbarComponent } from './canvas-toolbar/canvas-toolbar.component';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule, CanvasNodeComponent, CanvasEdgesComponent, CanvasToolbarComponent],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasComponent implements OnInit, OnDestroy {
  @ViewChild('canvasViewport') canvasViewportRef!: ElementRef<HTMLElement>;

  protected canvasService = inject(CanvasService);
  protected layoutService = inject(CanvasLayoutService);
  private sdk = inject(SDKService);

  private unsubscribeAll = new Subject<void>();
  private aragSlug = '';
  private isPanning = false;
  private panStartX = 0;
  private panStartY = 0;
  private panViewportX = 0;
  private panViewportY = 0;

  arranging = signal(false);

  nodes = this.canvasService.nodes;
  edges = this.canvasService.edges;
  selectedNodeId = this.canvasService.selectedNodeId;
  selectedEdgeId = this.canvasService.selectedEdgeId;
  pendingConnection = this.canvasService.pendingConnection;
  viewport = this.canvasService.viewport;
  loading = this.canvasService.loading;

  worldTransform = computed(() => {
    const vp = this.viewport();
    return `translate(${vp.x}px, ${vp.y}px) scale(${vp.scale})`;
  });

  isEmpty = computed(() => !this.loading() && this.nodes().filter(n => !n.isRoot).length === 0);

  ngOnInit(): void {
    this.sdk.currentArag.pipe(takeUntil(this.unsubscribeAll)).subscribe(arag => {
      if (arag) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.aragSlug = (arag as any).slug || '';
        this.canvasService.loadFromArag(arag, this.aragSlug);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.aragSlug) {
      this.canvasService.savePositions(this.aragSlug);
    }
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  onViewportPointerDown(event: PointerEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('app-canvas-node') || target.closest('.port')) return;

    this.isPanning = true;
    this.panStartX = event.clientX;
    this.panStartY = event.clientY;
    const vp = this.viewport();
    this.panViewportX = vp.x;
    this.panViewportY = vp.y;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);

    this.canvasService.selectNode(null);
    if (this.pendingConnection()) {
      this.canvasService.cancelConnection();
    }
  }

  onViewportPointerMove(event: PointerEvent): void {
    if (this.pendingConnection()) {
      const rect = this.canvasViewportRef?.nativeElement.getBoundingClientRect();
      if (rect) {
        const vp = this.viewport();
        const worldX = (event.clientX - rect.left - vp.x) / vp.scale;
        const worldY = (event.clientY - rect.top - vp.y) / vp.scale;
        this.canvasService.updatePendingConnection(worldX, worldY);
      }
    }

    if (!this.isPanning) return;

    const dx = event.clientX - this.panStartX;
    const dy = event.clientY - this.panStartY;
    this.canvasService.viewport.set({
      ...this.viewport(),
      x: this.panViewportX + dx,
      y: this.panViewportY + dy,
    });
  }

  onViewportPointerUp(_event: PointerEvent): void {
    this.isPanning = false;
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    if (!event.ctrlKey && !event.metaKey) return;

    const vp = this.viewport();
    const delta = -event.deltaY * 0.001;
    const newScale = Math.min(2.0, Math.max(0.2, vp.scale + delta));

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const scaleDiff = newScale - vp.scale;
    const newX = vp.x - mouseX * scaleDiff;
    const newY = vp.y - mouseY * scaleDiff;

    this.canvasService.viewport.set({ x: newX, y: newY, scale: newScale });
  }

  onNodeMoved(event: { id: string; x: number; y: number }): void {
    this.canvasService.setNodePosition(event.id, event.x, event.y);
  }

  onOutputPortDragStart(event: { nodeId: string; x: number; y: number }): void {
    this.canvasService.startConnection(event.nodeId);
  }

  onInputPortDrop(targetNodeId: string): void {
    if (this.pendingConnection()) {
      this.canvasService.finishConnection(targetNodeId);
    }
  }

  onNodeClick(nodeId: string): void {
    this.canvasService.selectNode(nodeId);
  }

  onFitView(): void {
    const nodes = this.nodes();
    if (!nodes.length) return;

    const rect = this.canvasViewportRef?.nativeElement.getBoundingClientRect();
    const vpW = rect?.width ?? 1200;
    const vpH = rect?.height ?? 800;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of nodes) {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.width);
      maxY = Math.max(maxY, n.y + n.height);
    }

    const padding = 80;
    const contentW = maxX - minX + padding * 2;
    const contentH = maxY - minY + padding * 2;
    const scale = Math.min(2.0, Math.max(0.2, Math.min(vpW / contentW, vpH / contentH)));
    const x = (vpW - contentW * scale) / 2 - (minX - padding) * scale;
    const y = (vpH - contentH * scale) / 2 - (minY - padding) * scale;

    this.canvasService.viewport.set({ x, y, scale });
  }

  onAutoArrange(): void {
    this.arranging.set(true);
    this.layoutService.arrange();
    setTimeout(() => this.arranging.set(false), 600);
  }

  openAddNodePanel(): void {
    // TODO: implement node picker panel
    console.log('Add node panel - not yet implemented');
  }
}
