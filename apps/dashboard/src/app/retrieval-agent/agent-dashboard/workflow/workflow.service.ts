import {
  ApplicationRef,
  ComponentRef,
  createComponent,
  ElementRef,
  inject,
  Injectable,
  Renderer2,
  RendererFactory2,
  signal,
} from '@angular/core';
import { ModalService } from '@guillotinaweb/pastanaga-angular';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { ConnectableEntryComponent, LinkService, NodeDirective, NodeSelectorComponent } from './basic-elements';
import { ConditionalNodeComponent } from './conditional-node/conditional-node.component';
import { CypherNodeComponent } from './cypher-node/cypher-node.component';
import { InternetNodeComponent } from './internet-node/internet-node.component';
import { NucliaDBNodeComponent } from './nucliadb-node/nucliadb-node.component';
import { RephraseNodeComponent } from './rephrase-node/rephrase-node.component';
import { RestartNodeComponent } from './restart-node/restart-node.component';
import { SqlNodeComponent } from './sql-node/sql-node.component';
import { SummarizeNodeComponent } from './summarize-node/summarize-node.component';
import { ValidationNodeComponent } from './validation-node/validation-node.component';
import { nodesByEntryType, nodeSelectorIcons, NodeType } from './workflow.models';

const COLUMN_CLASS = 'workflow-col';

@Injectable({
  providedIn: 'root',
})
export class WorkflowService {
  private translate = inject(TranslateService);
  private linkService = inject(LinkService);
  private modalService = inject(ModalService);
  private applicationRef = inject(ApplicationRef);
  private rendererFactory = inject(RendererFactory2);
  private renderer: Renderer2 = this.rendererFactory.createRenderer(null, null);
  private environmentInjector = this.applicationRef.injector;

  private columns: HTMLElement[] = [];
  private nodes: {
    [id: string]: {
      nodeRef: ComponentRef<NodeDirective>;
      nodeType: NodeType;
    };
  } = {};

  private _selectedNode = '';
  set selectedNode(nodeId: string) {
    this._selectedNode = nodeId;
  }
  get selectedNode() {
    return this._selectedNode;
  }
  private currentOrigin?: ConnectableEntryComponent;

  private _columnContainer?: ElementRef;
  set columnContainer(container: ElementRef) {
    this._columnContainer = container;
    const existingColumns = container.nativeElement.querySelectorAll(`.${COLUMN_CLASS}`);
    if (existingColumns) {
      existingColumns.forEach((column: HTMLElement) => {
        this.columns.push(column);
      });
    }
  }
  get columnContainer(): ElementRef | undefined {
    return this._columnContainer;
  }
  sidebarContentWrapper?: ElementRef;

  sideBarTitle = signal('');
  sideBarOpen = signal(false);

  /**
   * Trigger node creation by opening the sidebar containing the possible node types for the connectable entry of origin.
   * @param origin Connectable entry to be linked to the newly created node
   * @param columnIndex Index of the column in which the node should be added
   */
  triggerNodeCreation(origin: ConnectableEntryComponent, columnIndex: number) {
    if (!this.sidebarContentWrapper) {
      return;
    }
    // Keep only one origin point in active state
    if (this.currentOrigin) {
      this.currentOrigin.activeState.set(false);
    }
    this.currentOrigin = origin;
    // Unselect node if needed
    if (this.selectedNode) {
      this.selectNode('');
    }

    const originType = origin.type();
    const container: HTMLElement = this.sidebarContentWrapper.nativeElement;
    this.sideBarOpen.set(true);
    const titleKey = ['preprocess', 'postprocess', 'retrieval-context'].includes(originType)
      ? `retrieval-agents.workflow.sidebar-title.${originType}`
      : 'retrieval-agents.workflow.sidebar-title.default';
    this.sideBarTitle.set(this.translate.instant(titleKey));

    container.innerHTML = '';
    const possibleNodes = nodesByEntryType[originType] || [];
    possibleNodes.forEach((nodeType) => {
      const selectorRef = createComponent(NodeSelectorComponent, { environmentInjector: this.environmentInjector });
      selectorRef.setInput(
        'nodeTitle',
        this.translate.instant(`retrieval-agents.workflow.node-types.${nodeType}.title`),
      );
      selectorRef.setInput(
        'description',
        this.translate.instant(`retrieval-agents.workflow.node-types.${nodeType}.description`),
      );
      selectorRef.setInput('icon', nodeSelectorIcons[nodeType]);
      this.applicationRef.attachView(selectorRef.hostView);
      container.appendChild(selectorRef.location.nativeElement);
      selectorRef.changeDetectorRef.detectChanges();
      selectorRef.instance.select.subscribe(() => this.addNode(origin, columnIndex, nodeType));
    });
  }

  /**
   * Remove a node and the corresponding link from the workflow.
   * @param nodeRef Node to remove
   * @param column Column from which the node must be removed
   */
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
        this.updateLinksOnColumn(nodeRef.instance.columnIndex);
      });
  }

  /**
   * Add the node in the column and select it so the user can configure it
   * @param origin Connectable entry to be linked to the newly created node
   * @param columnIndex Index of the column in which the node should be added
   * @param nodeType Type of the node to be created
   */
  private addNode(origin: ConnectableEntryComponent, columnIndex: number, nodeType: NodeType) {
    if (this.columnContainer && this.columns.length <= columnIndex) {
      const newColumn = this.renderer.createElement('div') as HTMLElement;
      newColumn.classList.add(COLUMN_CLASS);
      this.renderer.appendChild(this.columnContainer.nativeElement, newColumn);
      this.columns.push(newColumn);
    }

    const column: HTMLElement = this.columns[columnIndex];
    let nodeRef: ComponentRef<NodeDirective> = this.getNodeRef(nodeType);
    nodeRef.setInput('origin', origin);
    nodeRef.instance.columnIndex = columnIndex;
    this.applicationRef.attachView(nodeRef.hostView);
    column.appendChild(nodeRef.location.nativeElement);
    nodeRef.changeDetectorRef.detectChanges();
    nodeRef.instance.addNode.subscribe((data) => this.triggerNodeCreation(data.entry, data.targetColumn));
    nodeRef.instance.removeNode.subscribe(() => this.removeNodeAndLink(nodeRef, column));
    nodeRef.instance.selectNode.subscribe(() => this.selectNode(nodeRef.instance.id));
    nodeRef.location.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

    this.nodes[nodeRef.instance.id] = { nodeRef, nodeType };
    this.selectNode(nodeRef.instance.id);
    origin.activeState.set(false);
  }

  /**
   * Select a node based on its id and open the corresponding configuration form on the sidebar.
   * @param nodeId Identifier of the node to select
   */
  private selectNode(nodeId: string) {
    if (this.selectedNode && this.nodes[this.selectedNode]) {
      this.nodes[this.selectedNode].nodeRef.setInput('state', 'default');
    }
    if (this.nodes[nodeId]) {
      this.nodes[nodeId].nodeRef.setInput('state', 'selected');
    }
    this.selectedNode = nodeId;
  }

  /**
   * Update all the links’ positions on the specified column.
   * @param columnIndex index of the column in which node’s links must be updated
   */
  private updateLinksOnColumn(columnIndex: number) {
    Object.values(this.nodes)
      .filter((node) => node.nodeRef.instance.columnIndex === columnIndex)
      .forEach((node) => {
        if (node.nodeRef.instance.boxComponent) {
          node.nodeRef.instance.boxComponent.updateLink();
        }
      });
  }

  /**
   * Create and return the component corresponding to the specified node type.
   * @param nodeType Type of the node to be created
   * @returns ComponentRef<NodeDirective> corresponding to the node type.
   */
  private getNodeRef(nodeType: NodeType): ComponentRef<NodeDirective> {
    switch (nodeType) {
      case 'rephrase':
        return createComponent(RephraseNodeComponent, {
          environmentInjector: this.environmentInjector,
        });
      case 'conditional':
        return createComponent(ConditionalNodeComponent, {
          environmentInjector: this.environmentInjector,
        });
      case 'validation':
        return createComponent(ValidationNodeComponent, {
          environmentInjector: this.environmentInjector,
        });
      case 'summarize':
        return createComponent(SummarizeNodeComponent, {
          environmentInjector: this.environmentInjector,
        });
      case 'restart':
        return createComponent(RestartNodeComponent, {
          environmentInjector: this.environmentInjector,
        });
      case 'nucliaDB':
        return createComponent(NucliaDBNodeComponent, {
          environmentInjector: this.environmentInjector,
        });
      case 'internet':
        return createComponent(InternetNodeComponent, {
          environmentInjector: this.environmentInjector,
        });
      case 'sql':
        return createComponent(SqlNodeComponent, {
          environmentInjector: this.environmentInjector,
        });
      case 'cypher':
        return createComponent(CypherNodeComponent, {
          environmentInjector: this.environmentInjector,
        });
    }
  }
}
