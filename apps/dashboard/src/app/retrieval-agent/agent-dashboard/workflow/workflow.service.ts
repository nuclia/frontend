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
import { ConnectableEntryComponent, NodeDirective } from './basic-elements';
import { ConditionalNodeComponent } from './conditional-node/conditional-node.component';

@Injectable({
  providedIn: 'root',
})
export class WorkflowService {
  private _container?: ElementRef;
  private _activeNode = '';
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

  set activeNode(nodeId: string) {
    if (this.activeNode && this.nodes[this.activeNode]) {
      this.nodes[this.activeNode].setInput('state', 'default');
    }
    if (this.nodes[nodeId]) {
      this.nodes[nodeId].setInput('state', 'selected');
      this._activeNode = nodeId;
    }
  }
  get activeNode() {
    return this._activeNode;
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

    this.nodes[nodeRef.instance.id] = nodeRef;
    this.activeNode = nodeRef.instance.id;
  }
}
