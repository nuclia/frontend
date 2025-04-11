import {
  ApplicationRef,
  ComponentRef,
  computed,
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
import {
  ConnectableEntryComponent,
  FormDirective,
  LinkService,
  NodeDirective,
  NodeSelectorComponent,
} from './basic-elements';
import {
  ConditionalFormComponent,
  ConditionalNodeComponent,
  CypherNodeComponent,
  InternetNodeComponent,
  NucliaDBNodeComponent,
  RephraseFormComponent,
  RephraseNodeComponent,
  RestartNodeComponent,
  SqlNodeComponent,
  SummarizeNodeComponent,
  ValidationNodeComponent,
} from './nodes';
import { AgentWorkflow, Node, NODE_SELECTOR_ICONS, NODES_BY_ENTRY_TYPE, NodeType } from './workflow.models';

const COLUMN_CLASS = 'workflow-col';
const SLIDE_DURATION = 800;

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
    [id: string]: Node;
  } = {};

  private _selectedNode = '';
  private _currentOrigin?: ConnectableEntryComponent;
  private _columnContainer?: ElementRef;
  private _sideBarTitle = signal('');
  private _sideBarDescription = signal('');
  private _sideBarOpen = signal(false);
  private _activeSideBar = signal<'' | 'drivers' | 'rules'>('');
  // TODO
  private _agentWorkflow = signal<AgentWorkflow>({
    preprocess: [],
    context: [],
    postprocess: [],
  });

  set selectedNode(nodeId: string) {
    this._selectedNode = nodeId;
  }
  get selectedNode() {
    return this._selectedNode;
  }
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

  // computed signals are readonly: we don't want components to interact directly with the sidebar
  sideBarTitle = computed(() => this._sideBarTitle());
  sideBarDescription = computed(() => this._sideBarDescription());
  sideBarOpen = computed(() => this._sideBarOpen());
  activeSideBar = computed(() => this._activeSideBar());

  /**
   * Trigger node creation by opening the sidebar containing the possible node types for the connectable entry of origin.
   * @param origin Connectable entry to be linked to the newly created node
   * @param columnIndex Index of the column in which the node should be added
   */
  triggerNodeCreation(origin: ConnectableEntryComponent, columnIndex: number) {
    if (!this.sidebarContentWrapper) {
      return;
    }
    this.resetState();

    this._currentOrigin = origin;
    const originType = origin.type();
    const titleKey = ['preprocess', 'postprocess', 'retrieval-context'].includes(originType)
      ? `retrieval-agents.workflow.sidebar.node-creation.${originType}`
      : 'retrieval-agents.workflow.sidebar.node-creation.default';
    const container: HTMLElement = this.openSidebarWithTitle(titleKey);
    container.classList.add('no-form');
    const possibleNodes = NODES_BY_ENTRY_TYPE[originType] || [];
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
      selectorRef.setInput('icon', NODE_SELECTOR_ICONS[nodeType]);
      this.applicationRef.attachView(selectorRef.hostView);
      container.appendChild(selectorRef.location.nativeElement);
      selectorRef.changeDetectorRef.detectChanges();
      selectorRef.instance.select.subscribe(() => {
        this.addNode(origin, columnIndex, nodeType);
      });
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
        this.closeSidebar();
      });
  }

  /**
   * Close the sidebar and reset its content and node selection.
   */
  closeSidebar() {
    this._sideBarOpen.set(false);
    this.unselectNode();
    // Wait until the slide animation is done before emptying the sidebar
    setTimeout(() => this.resetState(), SLIDE_DURATION);
  }

  /**
   * Open sidebar for specified content
   * @param content drivers | rules
   */
  openSidebar(content: 'drivers' | 'rules') {
    this.resetState();
    this._activeSideBar.set(content);
    this._sideBarTitle.set(this.translate.instant(`retrieval-agents.workflow.sidebar.${content}.title`));
    this._sideBarDescription.set(this.translate.instant(`retrieval-agents.workflow.sidebar.${content}.description`));
    // TODO components for those forms
    this._sideBarOpen.set(true);
  }

  /**
   * Reset state:
   * - remove current origin if any,
   * - reset sidebar title, description and content.
   */
  private resetState() {
    if (!this.sidebarContentWrapper) {
      throw new Error('Sidebar container not initialized');
    }
    // Unselect node if needed
    this.unselectNode();

    // remove current origin if any so all outputs have their default state
    if (this._currentOrigin) {
      this._currentOrigin.activeState.set(false);
      this._currentOrigin = undefined;
    }
    // Reset the side bar
    const container: HTMLElement = this.sidebarContentWrapper.nativeElement;
    this._activeSideBar.set('');
    this._sideBarTitle.set('');
    this._sideBarDescription.set('');
    container.innerHTML = '';
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
    origin.activeState.set(false);
    this.selectNode(nodeRef.instance.id);
  }

  /**
   * Select a node based on its id and open the corresponding configuration form on the sidebar.
   * @param nodeId Identifier of the node to select
   */
  private selectNode(nodeId: string) {
    if (!this.sidebarContentWrapper) {
      return;
    }
    this.resetState();
    const node = this.nodes[nodeId];
    if (node) {
      node.nodeRef.setInput('state', 'selected');
    }
    this.selectedNode = nodeId;

    const container: HTMLElement = this.openSidebarWithTitle(
      `retrieval-agents.workflow.node-types.${node.nodeType}.title`,
    );
    container.classList.remove('no-form');
    const formRef = this.getFormRef(node.nodeType);
    this.applicationRef.attachView(formRef.hostView);
    container.appendChild(formRef.location.nativeElement);
    formRef.changeDetectorRef.detectChanges();
    formRef.instance.submitForm.subscribe((config) => this.saveNodeConfiguration(config, nodeId));
    formRef.instance.cancel.subscribe(() => this.closeSidebar());

    const config = node.nodeConfig;
    if (config) {
      formRef.instance.configForm.patchValue(config);
    }
  }

  /**
   * Unselect current selected node if any
   */
  private unselectNode() {
    if (this.selectedNode && this.nodes[this.selectedNode]) {
      this.nodes[this.selectedNode].nodeRef.setInput('state', 'default');
    }
    this.selectedNode = '';
  }

  /**
   * Save the node configuration and close the sidebar.
   * @param config Node configuration
   * @param nodeId Identifier of the node to save
   */
  private saveNodeConfiguration(config: any, nodeId: string) {
    const node = this.nodes[nodeId];
    if (!node) {
      return;
    }
    node.nodeConfig = config;
    node.nodeRef.setInput('config', config);
    this.closeSidebar();
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
   * Open the sidebar with specified title
   * @param titleKey translation key of the sidebar title
   * @returns the sidebar content HTML element
   */
  private openSidebarWithTitle(titleKey: string): HTMLElement {
    if (!this.sidebarContentWrapper) {
      throw new Error('Sidebar container not initialized');
    }
    const container: HTMLElement = this.sidebarContentWrapper.nativeElement;
    this._sideBarOpen.set(true);
    this._sideBarTitle.set(this.translate.instant(titleKey));
    return container;
  }

  /**
   * Create and return the node component corresponding to the specified node type.
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
      case 'nuclia':
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

  /**
   * Create and return the form component corresponding to the specified node type.
   * @param nodeType Type of the node corresponding to the form to be created
   * @returns ComponentRef<FormDirective> corresponding to the node type.
   */
  private getFormRef(nodeType: NodeType): ComponentRef<FormDirective> {
    switch (nodeType) {
      case 'rephrase':
        return createComponent(RephraseFormComponent, { environmentInjector: this.environmentInjector });
      case 'conditional':
        return createComponent(ConditionalFormComponent, { environmentInjector: this.environmentInjector });
      case 'validation':
      case 'summarize':
      case 'restart':
      case 'nuclia':
      case 'internet':
      case 'sql':
      case 'cypher':
        // FIXME
        return createComponent(RephraseFormComponent, { environmentInjector: this.environmentInjector });
    }
  }
}
