import {
  ApplicationRef,
  ComponentRef,
  createComponent,
  ElementRef,
  inject,
  Injectable,
  Renderer2,
  RendererFactory2,
} from '@angular/core';
import { ModalService } from '@guillotinaweb/pastanaga-angular';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { ConnectableEntryComponent, LinkService, NodeDirective } from './basic-elements';
import { ConditionalNodeComponent } from './conditional-node/conditional-node.component';

@Injectable({
  providedIn: 'root',
})
export class WorkflowService {
  private _container?: ElementRef;
  private _selectedNode = '';
  private translate = inject(TranslateService);
  private linkService = inject(LinkService);
  private modalService = inject(ModalService);
  private applicationRef = inject(ApplicationRef);
  private rendererFactory = inject(RendererFactory2);
  private renderer: Renderer2 = this.rendererFactory.createRenderer(null, null);
  private environmentInjector = this.applicationRef.injector;

  private columns: HTMLElement[] = [];
  private nodes: { [id: string]: ComponentRef<NodeDirective> } = {};

  set columnContainer(element: ElementRef) {
    this._container = element;
  }
  get columnContainer(): ElementRef | undefined {
    return this._container;
  }

  set selectedNode(nodeId: string) {
    this._selectedNode = nodeId;
  }
  get selectedNode() {
    return this._selectedNode;
  }

  addNodeAndLink(origin: ConnectableEntryComponent, columnIndex: number) {
    if (this.columnContainer && this.columns.length <= columnIndex) {
      const newColumn = this.renderer.createElement('div') as HTMLElement;
      newColumn.classList.add('workflow-col');
      this.renderer.appendChild(this.columnContainer.nativeElement, newColumn);
      this.columns.push(newColumn);
    }

    const column: HTMLElement = this.columns[columnIndex];
    const nodeRef: ComponentRef<NodeDirective> = createComponent(ConditionalNodeComponent, {
      environmentInjector: this.environmentInjector,
    });
    nodeRef.setInput('origin', origin);
    nodeRef.instance.nextColumnIndex = columnIndex + 1;
    this.applicationRef.attachView(nodeRef.hostView);
    column.appendChild(nodeRef.location.nativeElement);
    nodeRef.changeDetectorRef.detectChanges();
    nodeRef.instance.addNode.subscribe((data) => this.addNodeAndLink(data.entry, data.targetColumn));
    nodeRef.instance.removeNode.subscribe(() => this.removeNodeAndLink(nodeRef, column));
    nodeRef.instance.selectNode.subscribe(() => this.selectNode(nodeRef.instance.id));
    nodeRef.location.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

    this.nodes[nodeRef.instance.id] = nodeRef;
    this.selectNode(nodeRef.instance.id);
  }

  removeNodeAndLink(nodeRef: ComponentRef<NodeDirective>, column: HTMLElement) {
    this.modalService
      .openConfirm({
        title: this.translate.instant('retrieval-agents.workflow.confirm-node-deletion.title'),
        description: this.translate.instant('retrieval-agents.workflow.confirm-node-deletion.description'),
        isDestructive: true,
        confirmLabel: this.translate.instant('retrieval-agents.workflow.confirm-node-deletion.confirm-button'),
      })
      .onClose.pipe(filter((confirm) => !!confirm))
      .subscribe(() => {
        if (nodeRef.instance.boxComponent?.linkRef) {
          this.linkService.removeLink(nodeRef.instance.boxComponent.linkRef);
        }
        column.removeChild(nodeRef.location.nativeElement);
        this.applicationRef.detachView(nodeRef.hostView);
        delete this.nodes[nodeRef.instance.id];
        if (this.selectedNode === nodeRef.instance.id) {
          this.selectedNode = '';
        }
        this.updateLinksOnColumn(nodeRef.instance.nextColumnIndex);
      });
  }

  private selectNode(nodeId: string) {
    if (this.selectedNode && this.nodes[this.selectedNode]) {
      this.nodes[this.selectedNode].setInput('state', 'default');
    }
    if (this.nodes[nodeId]) {
      this.nodes[nodeId].setInput('state', 'selected');
    }
    this.selectedNode = nodeId;
  }

  private updateLinksOnColumn(nextColumnIndex: number) {
    Object.values(this.nodes)
      .filter((nodeRef) => nodeRef.instance.nextColumnIndex === nextColumnIndex)
      .forEach((nodeRef) => {
        if (nodeRef.instance.boxComponent) {
          nodeRef.instance.boxComponent.updateLink();
        }
      });
  }
}
