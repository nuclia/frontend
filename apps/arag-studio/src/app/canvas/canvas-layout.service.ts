import { Injectable, inject } from '@angular/core';
import { CanvasService } from './canvas.service';

const GROUP_X: Record<string, number> = {
  root: 60,
  preprocess: 350,
  context: 700,
  generation: 1050,
  postprocess: 1400,
};

const CENTER_Y = 300;
const NODE_SPACING = 180;
const NODE_WIDTH = 220;
const NODE_HEIGHT = 100;
const ROOT_WIDTH = 160;
const ROOT_HEIGHT = 80;

@Injectable({ providedIn: 'root' })
export class CanvasLayoutService {
  private canvasService = inject(CanvasService);

  arrange(): void {
    const nodes = this.canvasService.nodes();
    const groupedByCategory: Record<string, typeof nodes> = {};

    for (const node of nodes) {
      const cat = node.category;
      if (!groupedByCategory[cat]) groupedByCategory[cat] = [];
      groupedByCategory[cat].push(node);
    }

    const updatedNodes = nodes.map(node => {
      const x = GROUP_X[node.category] ?? 60;
      const catNodes = groupedByCategory[node.category] ?? [];
      const index = catNodes.indexOf(node);
      const total = catNodes.length;
      const y = CENTER_Y + (index - (total - 1) / 2) * NODE_SPACING;
      const width = node.isRoot ? ROOT_WIDTH : NODE_WIDTH;
      const height = node.isRoot ? ROOT_HEIGHT : NODE_HEIGHT;
      return { ...node, x, y, width, height };
    });

    this.canvasService.nodes.set(updatedNodes);
  }
}
