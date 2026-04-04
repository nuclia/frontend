import {
  Directive,
  ElementRef,
  inject,
  NgZone,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { WorkflowService } from '../../../../../libs/common/src/lib/retrieval-agent/agent-dashboard/workflow/workflow.service';

const WORKFLOW_CONTAINER_SEL = '.workflow-container';
const COLUMN_SECTION_SEL = '.column-section';
const NODE_BOX_SEL = 'app-node-box';
const DRAG_HANDLE_CLASS = 'arag-drag-handle';
const DRAG_GHOST_CLASS = 'arag-drag-ghost';
const DROP_TARGET_CLASS = 'drag-drop-target';
const DROP_INDICATOR_CLASS = 'drag-drop-indicator';

@Directive({
  selector: '[appWorkflowCanvas]',
  standalone: true,
})
export class WorkflowCanvasDirective implements OnInit, OnDestroy {
  private host = inject(ElementRef<HTMLElement>);
  private zone = inject(NgZone);
  private workflowService = inject(WorkflowService);

  private containerObserver?: MutationObserver;
  private nodeObserver?: MutationObserver;
  private workflowContainer?: HTMLElement;
  private decoratedNodes = new WeakSet<HTMLElement>();

  // HTML5 drag state
  private draggingComponent?: HTMLElement;  // direct child of .column-section
  private dropIndicator?: HTMLElement;
  private dragOverSection?: HTMLElement;
  private dragOverSibling?: HTMLElement | null;

  // Pan state
  private isPanning = false;
  private panStartX = 0;
  private panStartY = 0;
  private scrollStartX = 0;
  private scrollStartY = 0;
  private panPointerId?: number;

  private onPointerDownBound = this.onCanvasPointerDown.bind(this);
  private onPointerMoveBound = this.onCanvasPointerMove.bind(this);
  private onPointerUpBound = this.onCanvasPointerUp.bind(this);

  ngOnInit() {
    this.zone.runOutsideAngular(() => {
      this.containerObserver = new MutationObserver(() => this.detectWorkflowContainer());
      this.containerObserver.observe(this.host.nativeElement, { childList: true, subtree: true });
      this.detectWorkflowContainer();
    });
  }

  ngOnDestroy() {
    this.containerObserver?.disconnect();
    this.nodeObserver?.disconnect();
    this.detachPanListeners();
    this.dropIndicator?.remove();
  }

  // ── Container detection ───────────────────────────────────────────────────

  private detectWorkflowContainer() {
    const container = this.host.nativeElement.querySelector(WORKFLOW_CONTAINER_SEL) as HTMLElement | null;
    if (container && container !== this.workflowContainer) {
      this.workflowContainer = container;
      this.attachPanListeners(container);
      this.watchForNewNodes(container);
      // Decorate any nodes already present
      container.querySelectorAll<HTMLElement>(`${COLUMN_SECTION_SEL} > *`).forEach((n) => this.decorateNode(n));
    }
  }

  // ── Canvas pan ────────────────────────────────────────────────────────────

  private attachPanListeners(container: HTMLElement) {
    container.addEventListener('pointerdown', this.onPointerDownBound);
    container.addEventListener('pointermove', this.onPointerMoveBound);
    container.addEventListener('pointerup', this.onPointerUpBound);
    container.addEventListener('pointercancel', this.onPointerUpBound);
  }

  private detachPanListeners() {
    this.workflowContainer?.removeEventListener('pointerdown', this.onPointerDownBound);
    this.workflowContainer?.removeEventListener('pointermove', this.onPointerMoveBound);
    this.workflowContainer?.removeEventListener('pointerup', this.onPointerUpBound);
    this.workflowContainer?.removeEventListener('pointercancel', this.onPointerUpBound);
  }

  private onCanvasPointerDown(event: PointerEvent) {
    const target = event.target as HTMLElement;
    // Only pan when clicking directly on the background (not on nodes / buttons)
    const onBackground = target === this.workflowContainer || target.closest('.workflow-col') === target.closest(COLUMN_SECTION_SEL)?.parentElement?.parentElement;
    const onNode = !!target.closest(NODE_BOX_SEL) || !!target.closest('button') || !!target.closest('input') || !!target.closest('select') || !!target.closest('pa-button');
    if (!onNode && onBackground && this.workflowContainer) {
      this.isPanning = true;
      this.panPointerId = event.pointerId;
      this.panStartX = event.clientX;
      this.panStartY = event.clientY;
      this.scrollStartX = this.workflowContainer.scrollLeft;
      this.scrollStartY = this.workflowContainer.scrollTop;
      this.workflowContainer.style.cursor = 'grabbing';
      this.workflowContainer.setPointerCapture(event.pointerId);
    }
  }

  private onCanvasPointerMove(event: PointerEvent) {
    if (!this.isPanning || event.pointerId !== this.panPointerId || !this.workflowContainer) return;
    this.workflowContainer.scrollLeft = this.scrollStartX - (event.clientX - this.panStartX);
    this.workflowContainer.scrollTop = this.scrollStartY - (event.clientY - this.panStartY);
  }

  private onCanvasPointerUp(event: PointerEvent) {
    if (event.pointerId !== this.panPointerId) return;
    this.isPanning = false;
    if (this.workflowContainer) this.workflowContainer.style.cursor = '';
  }

  // ── Node drag decoration ──────────────────────────────────────────────────

  /** Watch for new nodes added to column sections by WorkflowService */
  private watchForNewNodes(container: HTMLElement) {
    this.nodeObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            // Direct child of a column section = a subagent node component
            if (el.parentElement?.classList.contains('column-section')) {
              this.decorateNode(el);
            }
            // Also scan descendants (in case a column was added containing nodes)
            el.querySelectorAll<HTMLElement>(`${COLUMN_SECTION_SEL} > *`).forEach((n) => this.decorateNode(n));
          }
        });
      }
    });
    this.nodeObserver.observe(container, { childList: true, subtree: true });
  }

  /**
   * Inject a drag handle into a node component and wire up HTML5 drag events.
   * Only called on direct children of `.column-section` (the subagent components).
   */
  private decorateNode(nodeComponent: HTMLElement) {
    if (this.decoratedNodes.has(nodeComponent)) return;
    this.decoratedNodes.add(nodeComponent);

    // Find the app-node-box inside this component
    const nodeBox = nodeComponent.querySelector<HTMLElement>(NODE_BOX_SEL);
    if (!nodeBox || nodeBox.classList.contains('is-root')) return; // skip root node

    // Inject a drag handle at the top of the node-box
    const handle = document.createElement('div');
    handle.className = DRAG_HANDLE_CLASS;
    handle.setAttribute('title', 'Drag to reorder');
    handle.innerHTML = `
      <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
        <rect y="0" width="16" height="2" rx="1" fill="currentColor"/>
        <rect y="4" width="16" height="2" rx="1" fill="currentColor"/>
        <rect y="8" width="16" height="2" rx="1" fill="currentColor"/>
      </svg>`;
    nodeBox.prepend(handle);

    // Enable dragging only when the handle is pressed (prevents interfering with form inputs)
    handle.addEventListener('mousedown', () => {
      nodeComponent.draggable = true;
    });
    nodeComponent.addEventListener('dragend', () => {
      nodeComponent.draggable = false;
    });

    // HTML5 drag events on the component host element
    nodeComponent.addEventListener('dragstart', (e) => this.onDragStart(e, nodeComponent));
    nodeComponent.addEventListener('dragend', (e) => this.onDragEnd(e));

    // Drop zone events on the column section
    const section = nodeComponent.parentElement as HTMLElement;
    if (!section.dataset['dragListening']) {
      section.dataset['dragListening'] = 'true';
      section.addEventListener('dragover', (e) => this.onSectionDragOver(e, section));
      section.addEventListener('dragenter', (e) => this.onSectionDragEnter(e, section));
      section.addEventListener('dragleave', (e) => this.onSectionDragLeave(e, section));
      section.addEventListener('drop', (e) => this.onSectionDrop(e, section));
    }
  }

  // ── HTML5 drag handlers ───────────────────────────────────────────────────

  private onDragStart(event: DragEvent, nodeComponent: HTMLElement) {
    this.draggingComponent = nodeComponent;
    event.dataTransfer!.effectAllowed = 'move';
    // Transparent ghost (we style it with CSS)
    const ghost = document.createElement('div');
    ghost.className = DRAG_GHOST_CLASS;
    ghost.textContent = nodeComponent.querySelector('.title-s')?.textContent?.trim() ?? 'Node';
    document.body.appendChild(ghost);
    event.dataTransfer!.setDragImage(ghost, 80, 20);
    requestAnimationFrame(() => ghost.remove());

    nodeComponent.classList.add('is-dragging');
    this.ensureDropIndicator();
  }

  private onDragEnd(_event: DragEvent) {
    this.draggingComponent?.classList.remove('is-dragging');
    this.draggingComponent = undefined;
    this.cleanupDragUI();
  }

  private onSectionDragEnter(event: DragEvent, section: HTMLElement) {
    event.preventDefault();
    section.classList.add(DROP_TARGET_CLASS);
  }

  private onSectionDragOver(event: DragEvent, section: HTMLElement) {
    if (!this.draggingComponent) return;
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    this.dragOverSection = section;

    // Find where to insert (above/below which sibling)
    const sibling = this.getSiblingAtPoint(section, event.clientY);
    this.dragOverSibling = sibling;
    this.positionDropIndicator(section, sibling);
  }

  private onSectionDragLeave(event: DragEvent, section: HTMLElement) {
    // Only clear if truly leaving the section (not entering a child)
    if (!section.contains(event.relatedTarget as Node)) {
      section.classList.remove(DROP_TARGET_CLASS);
      this.dropIndicator?.style.setProperty('display', 'none');
    }
  }

  private onSectionDrop(event: DragEvent, section: HTMLElement) {
    event.preventDefault();
    if (!this.draggingComponent) return;

    const sibling = this.dragOverSibling;
    if (sibling) {
      section.insertBefore(this.draggingComponent, sibling);
    } else {
      section.appendChild(this.draggingComponent);
    }

    // Re-attach section drag listeners if node moved to a new section
    if (!section.dataset['dragListening']) {
      section.dataset['dragListening'] = 'true';
      section.addEventListener('dragover', (e) => this.onSectionDragOver(e, section));
      section.addEventListener('dragenter', (e) => this.onSectionDragEnter(e, section));
      section.addEventListener('dragleave', (e) => this.onSectionDragLeave(e, section));
      section.addEventListener('drop', (e) => this.onSectionDrop(e, section));
    }

    this.cleanupDragUI();
    // Redraw SVG links (WorkflowService listens to window resize to update links)
    window.dispatchEvent(new Event('resize'));
  }

  // ── Drop indicator ────────────────────────────────────────────────────────

  private ensureDropIndicator() {
    if (!this.dropIndicator) {
      const el = document.createElement('div');
      el.className = DROP_INDICATOR_CLASS;
      document.body.appendChild(el);
      this.dropIndicator = el;
    }
    this.dropIndicator.style.display = 'none';
  }

  private positionDropIndicator(section: HTMLElement, beforeSibling: HTMLElement | null) {
    if (!this.dropIndicator) return;
    let refRect: DOMRect;
    let above = false;
    if (beforeSibling) {
      refRect = beforeSibling.getBoundingClientRect();
      above = true;
    } else {
      const last = Array.from(section.children).filter((c) => c !== this.draggingComponent).at(-1);
      if (!last) {
        this.dropIndicator.style.display = 'none';
        return;
      }
      refRect = last.getBoundingClientRect();
      above = false;
    }
    const top = above ? refRect.top + window.scrollY - 3 : refRect.bottom + window.scrollY + 3;
    this.dropIndicator.style.cssText = `
      display: block;
      position: absolute;
      left: ${refRect.left + window.scrollX}px;
      top: ${top}px;
      width: ${refRect.width}px;
      height: 3px;
      background: var(--color-primary-regular, #5c2fff);
      border-radius: 3px;
      z-index: 9999;
      pointer-events: none;
    `;
  }

  private getSiblingAtPoint(section: HTMLElement, clientY: number): HTMLElement | null {
    const children = Array.from(section.children).filter(
      (c) => c !== this.draggingComponent,
    ) as HTMLElement[];
    return (
      children.find((child) => {
        const rect = child.getBoundingClientRect();
        return clientY < rect.top + rect.height / 2;
      }) ?? null
    );
  }

  private cleanupDragUI() {
    this.workflowContainer?.querySelectorAll(`.${DROP_TARGET_CLASS}`).forEach((el) => {
      el.classList.remove(DROP_TARGET_CLASS);
    });
    if (this.dropIndicator) {
      this.dropIndicator.style.display = 'none';
    }
    this.dragOverSection = undefined;
    this.dragOverSibling = undefined;
  }
}
