import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { CanvasNode } from '../canvas.models';

const CATEGORY_COLORS: Record<string, string> = {
  preprocess: '#7b61ff',
  context: '#0ea5e9',
  generation: '#10b981',
  postprocess: '#f59e0b',
  root: '#64748b',
};

@Component({
  selector: 'app-canvas-node',
  standalone: true,
  imports: [CommonModule, PaIconModule],
  templateUrl: './canvas-node.component.html',
  styleUrl: './canvas-node.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasNodeComponent implements OnDestroy {
  node = input.required<CanvasNode>();
  selected = input(false);
  scale = input(1);

  nodeMoved = output<{ id: string; x: number; y: number }>();
  outputPortDragStart = output<{ nodeId: string; x: number; y: number }>();
  inputPortDrop = output<string>();

  private dragging = false;
  private startScreenX = 0;
  private startScreenY = 0;
  private startNodeX = 0;
  private startNodeY = 0;
  private pointerId: number | null = null;

  private boundPointerMove = this.onPointerMove.bind(this);
  private boundPointerUp = this.onPointerUp.bind(this);

  constructor(private el: ElementRef) {}

  ngOnDestroy(): void {
    this.cleanup();
  }

  categoryColor(): string {
    return CATEGORY_COLORS[this.node().category] ?? '#64748b';
  }

  onPointerDown(event: PointerEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('.port')) return;

    event.preventDefault();
    event.stopPropagation();

    this.dragging = true;
    this.startScreenX = event.clientX;
    this.startScreenY = event.clientY;
    const n = this.node();
    this.startNodeX = n.x;
    this.startNodeY = n.y;
    this.pointerId = event.pointerId;

    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    document.addEventListener('pointermove', this.boundPointerMove);
    document.addEventListener('pointerup', this.boundPointerUp);
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.dragging || event.pointerId !== this.pointerId) return;

    const s = this.scale() || 1;
    const dx = (event.clientX - this.startScreenX) / s;
    const dy = (event.clientY - this.startScreenY) / s;

    this.nodeMoved.emit({
      id: this.node().id,
      x: this.startNodeX + dx,
      y: this.startNodeY + dy,
    });
  }

  private onPointerUp(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) return;
    this.dragging = false;
    this.cleanup();
  }

  onOutputPortPointerDown(event: PointerEvent): void {
    event.stopPropagation();
    event.preventDefault();
    const node = this.node();
    this.outputPortDragStart.emit({
      nodeId: node.id,
      x: node.x + node.width,
      y: node.y + node.height / 2,
    });
  }

  onInputPortPointerUp(event: PointerEvent): void {
    event.stopPropagation();
    this.inputPortDrop.emit(this.node().id);
  }

  private cleanup(): void {
    document.removeEventListener('pointermove', this.boundPointerMove);
    document.removeEventListener('pointerup', this.boundPointerUp);
  }
}
