import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaButtonModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { CanvasService } from '../canvas.service';
import { CanvasLayoutService } from '../canvas-layout.service';

const MIN_SCALE = 0.2;
const MAX_SCALE = 2.0;
const ZOOM_STEP = 0.15;

@Component({
  selector: 'app-canvas-toolbar',
  standalone: true,
  imports: [CommonModule, PaButtonModule, PaIconModule, TranslateModule],
  template: `
    <div class="canvas-toolbar">
      <div class="toolbar-group">
        <button class="toolbar-btn" (click)="onAutoArrange()" title="Auto-arrange">
          <pa-icon name="sort"></pa-icon>
          <span>Auto-arrange</span>
        </button>
        <button class="toolbar-btn" (click)="onFitView()" title="Fit view">
          <pa-icon name="expand"></pa-icon>
          <span>Fit view</span>
        </button>
      </div>

      <div class="toolbar-group toolbar-zoom">
        <button class="toolbar-btn toolbar-btn--icon" (click)="onZoomOut()" title="Zoom out">
          <pa-icon name="minus"></pa-icon>
        </button>
        <span class="zoom-label">{{ zoomPercent() }}%</span>
        <button class="toolbar-btn toolbar-btn--icon" (click)="onZoomIn()" title="Zoom in">
          <pa-icon name="add"></pa-icon>
        </button>
      </div>

      <div class="toolbar-group">
        <span class="node-count">{{ nodeCount() }} nodes</span>
        <button class="toolbar-btn toolbar-btn--primary" (click)="addNode.emit()" title="Add node">
          <pa-icon name="add"></pa-icon>
          <span>Add node</span>
        </button>
      </div>
    </div>
  `,
  styleUrl: './canvas-toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasToolbarComponent {
  viewportWidth = input(1200);
  viewportHeight = input(800);

  addNode = output<void>();
  fitView = output<void>();

  protected canvasService = inject(CanvasService);
  protected layoutService = inject(CanvasLayoutService);

  nodeCount = () => this.canvasService.nodes().length;
  zoomPercent = () => Math.round(this.canvasService.viewport().scale * 100);

  onAutoArrange(): void {
    this.layoutService.arrange();
  }

  onFitView(): void {
    this.fitView.emit();
  }

  onZoomIn(): void {
    const vp = this.canvasService.viewport();
    const newScale = Math.min(MAX_SCALE, vp.scale + ZOOM_STEP);
    this.canvasService.viewport.set({ ...vp, scale: newScale });
  }

  onZoomOut(): void {
    const vp = this.canvasService.viewport();
    const newScale = Math.max(MIN_SCALE, vp.scale - ZOOM_STEP);
    this.canvasService.viewport.set({ ...vp, scale: newScale });
  }
}
