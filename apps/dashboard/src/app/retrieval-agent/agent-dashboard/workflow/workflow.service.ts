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
import { SDKService } from '@flaps/core';
import { ModalService } from '@guillotinaweb/pastanaga-angular';
import { TranslateService } from '@ngx-translate/core';
import {
  AskAgent,
  ContextAgent,
  ContextAgentCreation,
  PostprocessAgent,
  PostprocessAgentCreation,
  PreprocessAgent,
  PreprocessAgentCreation,
  RephraseAgent,
  SqlAgent,
} from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { catchError, forkJoin, of, switchMap, tap } from 'rxjs';
import {
  ConnectableEntryComponent,
  FormDirective,
  LinkService,
  NodeDirective,
  NodeSelectorComponent,
} from './basic-elements';
import {
  AskFormComponent,
  AskNodeComponent,
  ConditionalFormComponent,
  ConditionalNodeComponent,
  CypherFormComponent,
  CypherNodeComponent,
  HistoricalFormComponent,
  HistoricalNodeComponent,
  InternetFormComponent,
  InternetNodeComponent,
  RephraseFormComponent,
  RephraseNodeComponent,
  RestartFormComponent,
  RestartNodeComponent,
  SqlFormComponent,
  SqlNodeComponent,
  SummarizeFormComponent,
  SummarizeNodeComponent,
  ValidationNodeComponent,
} from './nodes';
import { RulesPanelComponent } from './sidebar';
import {
  askAgentToUi,
  askUiToCreation,
  getNodeTypeFromAgent,
  InternetAgent,
  internetAgentToUi,
  internetUiToCreation,
  NODE_SELECTOR_ICONS,
  NodeCategory,
  NodeConfig,
  NODES_BY_ENTRY_TYPE,
  NodeType,
  rephraseAgentToUi,
  rephraseUiToCreation,
  sqlAgentToUi,
  sqlUiToCreation,
  WorkflowRoot,
} from './workflow.models';
import {
  addNode,
  deleteNode,
  getAllNodes,
  resetCurrentOrigin,
  resetNodes,
  resetSidebar,
  selectNode,
  setActiveSidebar,
  setCurrentOrigin,
  setOpenSidebar,
  setSidebarHeader,
  unselectNode,
  updateNode,
} from './workflow.state';

const COLUMN_CLASS = 'workflow-col';
const SLIDE_DURATION = 800;

@Injectable({
  providedIn: 'root',
})
export class WorkflowService {
  private sdk = inject(SDKService);
  private toaster = inject(SisToastService);
  private translate = inject(TranslateService);
  private linkService = inject(LinkService);
  private modalService = inject(ModalService);
  private applicationRef = inject(ApplicationRef);
  private rendererFactory = inject(RendererFactory2);
  private renderer: Renderer2 = this.rendererFactory.createRenderer(null, null);
  private environmentInjector = this.applicationRef.injector;

  private columns: HTMLElement[] = [];

  private _workflowRoot?: WorkflowRoot;
  private _columnContainer?: ElementRef;
  private _currentPanel?: ComponentRef<RulesPanelComponent | FormDirective>;

  set workflowRoot(root: WorkflowRoot) {
    this._workflowRoot = root;
  }
  get workflowRoot(): WorkflowRoot | undefined {
    return this._workflowRoot;
  }

  set columnContainer(container: ElementRef) {
    // columnContainer setter is called on init of agent-dashboard, so we first clear columns from previous dashboard if any (can happened when switching arag)
    this.columns = [];
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
  sidebarHeader?: ElementRef;
  sidebarContentWrapper?: ElementRef;

  /**
   * Initialise the workflow with the agents saved in current Arag, update the workflow when current Arag changes.
   */
  initAndUpdateWorkflow(root: WorkflowRoot) {
    this.workflowRoot = root;
    return this.sdk.currentArag.pipe(
      switchMap((arag) => forkJoin([arag.getPreprocess(), arag.getContext(), arag.getPostprocess()])),
      catchError(() => {
        this.toaster.error(this.translate.instant('retrieval-agents.workflow.errors.loading-workflow'));
        return of([[], [], []]);
      }),
      tap(([preprocess, context, postprocess]) => {
        this.cleanWorkflow();
        preprocess.forEach((agent) => {
          setTimeout(() => {
            this.createNodeFromSavedWorkflow(root.preprocess, 'preprocess', agent);
          });
        });
        context.forEach((agent) => {
          setTimeout(() => {
            this.createNodeFromSavedWorkflow(root.context, 'context', agent);
          });
        });
        postprocess.forEach((agent) => {
          setTimeout(() => {
            this.createNodeFromSavedWorkflow(root.postprocess, 'postprocess', agent);
          });
        });
      }),
    );
  }

  /**
   * Create and add node on workflow based on what is saved in current Arag
   * @param rootEntry
   * @param nodeCategory
   * @param agent
   */
  private createNodeFromSavedWorkflow(
    rootEntry: ConnectableEntryComponent,
    nodeCategory: NodeCategory,
    agent: PreprocessAgent | ContextAgent | PostprocessAgent,
  ) {
    const nodeType = getNodeTypeFromAgent(agent);
    const nodeRef = this.addNode(rootEntry, 1, nodeType, nodeCategory);
    const config = this.getConfigFromAgent(agent);
    updateNode(nodeRef.instance.id, nodeCategory, { nodeConfig: config, agent });
  }

  /**
   * Reset the workflow by removing all nodes
   */
  cleanWorkflow() {
    this.closeSidebar();
    resetNodes();
    // FIXME: call this._removeNodeAndLinks in effect?
  }

  /**
   * Trigger add node from the toolbar: open the sidebar with the list of possible nodes for each root entry.
   * Selecting a node will add it directly to corresponding root entry.
   */
  triggerAddNode() {
    if (!this.workflowRoot) {
      throw new Error('Workflow root not initialized');
    }
    const root = this.workflowRoot;
    this.resetState();
    setActiveSidebar('add');
    const container: HTMLElement = this.openSidebarWithTitle(`retrieval-agents.workflow.sidebar.node-creation.toolbar`);
    container.classList.add('no-form');
    const sections: NodeCategory[] = ['preprocess', 'context', 'postprocess'];
    sections.forEach((section) => {
      const title: HTMLElement = this.renderer.createElement('div');
      title.classList.add('section-title');
      title.textContent = this.translate.instant(`retrieval-agents.workflow.node-types.root.${section}`);
      container.appendChild(title);
      this.displayPossibleNodes(section, container, root[section], 1);
    });
  }

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

    setCurrentOrigin(origin);
    const originCategory = origin.category();
    const container: HTMLElement = this.openSidebarWithTitle(
      `retrieval-agents.workflow.sidebar.node-creation.${originCategory}`,
    );
    container.classList.add('no-form');
    this.displayPossibleNodes(originCategory, container, origin, columnIndex);
  }

  /**
   * Display the list of possible nodes for a node category
   * @param nodeCategory Entry type of origin: 'preprocess' | 'context' | 'postprocess'
   * @param container sidebar container
   * @param origin Connectable entry to be linked to the newly created node when selecting one of the listed nodes
   * @param columnIndex Index of the column in which the node should be added
   */
  private displayPossibleNodes(
    nodeCategory: NodeCategory,
    container: HTMLElement,
    origin: ConnectableEntryComponent,
    columnIndex: number,
  ) {
    const possibleNodes = NODES_BY_ENTRY_TYPE[nodeCategory] || [];
    possibleNodes.forEach((nodeType, index) => {
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
        const nodeRef = this.addNode(origin, columnIndex, nodeType, nodeCategory);
        nodeRef.location.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        this.selectNode(nodeRef.instance.id, nodeCategory);
      });

      if (index === possibleNodes.length - 1) {
        selectorRef.location.nativeElement.classList.add('last-of-section');
      }
    });
  }

  /**
   * Remove a node and the corresponding links from the workflow. Ask for confirmation if the node was already stored in the backend.
   * @param nodeRef Node to remove
   * @param column Column from which the node must be removed
   */
  removeNodeAndLink(nodeRef: ComponentRef<NodeDirective>, column: HTMLElement) {
    // if (!agent) {
    this._removeNodeAndLinks(nodeRef, column);
    this.closeSidebar();
    // } else {
    // const category = nodeRef.instance.category();
    // const node = getNode(nodeRef.instance.id, category);
    // const agent = node?.agent;
    //   this.modalService
    //     .openConfirm({
    //       title: this.translate.instant('retrieval-agents.workflow.confirm-node-deletion.title'),
    //       description: this.translate.instant('retrieval-agents.workflow.confirm-node-deletion.description'),
    //       isDestructive: true,
    //       confirmLabel: this.translate.instant('retrieval-agents.workflow.confirm-node-deletion.confirm-button'),
    //     })
    //     .onClose.pipe(
    //       filter((confirm) => !!confirm),
    //       switchMap(() =>
    //         this.sdk.currentArag.pipe(
    //           take(1),
    //           switchMap((arag) => {
    //             switch (node.nodeType) {
    //               case 'historical':
    //               case 'rephrase':
    //                 return arag.deletePreprocess(agent.id);
    //               case 'conditional':
    //               case 'ask':
    //               case 'internet':
    //               case 'sql':
    //               case 'cypher':
    //                 return arag.deleteContext(agent.id);
    //               case 'validation':
    //               case 'summarize':
    //               case 'restart':
    //               case 'remi':
    //                 return arag.deletePostprocess(agent.id);
    //             }
    //           }),
    //         ),
    //       ),
    //     )
    //     .subscribe({
    //       next: () => {
    //         this._removeNodeAndLinks(nodeRef, column);
    //         this.closeSidebar();
    //       },
    //       error: () => this.toaster.error(this.translate.instant('retrieval-agents.workflow.errors.delete-agent')),
    //     });
    // }
  }

  private _removeNodeAndLinks(nodeRef: ComponentRef<NodeDirective>, column: HTMLElement) {
    // Remove selected node
    this._removeFromDom(nodeRef, column);
    unselectNode();

    // Remove also corresponding children
    const deletedChildren = deleteNode(nodeRef.instance.id, nodeRef.instance.category());
    deletedChildren.forEach((ref) => {
      const columnIndex = ref.instance.columnIndex;
      const childColumn = this.columns[columnIndex];
      this._removeFromDom(ref, childColumn);
    });

    // Update remaining links positions
    this.updateLinksOnColumn(nodeRef.instance.columnIndex);
  }

  private _removeFromDom(nodeRef: ComponentRef<NodeDirective>, column: HTMLElement) {
    if (nodeRef.instance.boxComponent.linkRef) {
      this.linkService.removeLink(nodeRef.instance.boxComponent.linkRef);
    }
    column.removeChild(nodeRef.location.nativeElement);
    this.applicationRef.detachView(nodeRef.hostView);
  }

  /**
   * Close the sidebar and reset its content and node selection.
   */
  closeSidebar() {
    setOpenSidebar(false);
    unselectNode();
    // Wait until the slide animation is done before emptying the sidebar
    setTimeout(() => this.resetState(), SLIDE_DURATION);
  }

  /**
   * Open rule sidebar
   */
  openRuleSidebar() {
    this.resetState();
    setActiveSidebar('rules');

    const container: HTMLElement = this.openSidebarWithTitle(
      `retrieval-agents.workflow.sidebar.rules.title`,
      `retrieval-agents.workflow.sidebar.rules.description`,
    );
    container.classList.remove('no-form');
    const panelRef = createComponent(RulesPanelComponent, { environmentInjector: this.environmentInjector });
    this.applicationRef.attachView(panelRef.hostView);
    container.appendChild(panelRef.location.nativeElement);
    panelRef.changeDetectorRef.detectChanges();
    panelRef.instance.cancel.subscribe(() => this.closeSidebar());
    setTimeout(() => {
      if (this.sidebarHeader) {
        const headerHeight = this.sidebarHeader.nativeElement.getBoundingClientRect().height;
        panelRef.setInput('headerHeight', `${headerHeight}px`);
      }
    });
    this._currentPanel = panelRef;
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
    unselectNode();

    // remove current origin if any so all outputs have their default state
    resetCurrentOrigin();

    // Reset the side bar
    const container: HTMLElement = this.sidebarContentWrapper.nativeElement;
    resetSidebar();
    if (this._currentPanel) {
      this._currentPanel.destroy();
      this._currentPanel = undefined;
    }
    container.innerHTML = '';
  }

  /**
   * Add the node in the column
   * @param origin Connectable entry to be linked to the newly created node
   * @param columnIndex Index of the column in which the node should be added
   * @param nodeType Type of the node to be created
   * @returns ComponentRef<NodeDirective>: Created node referrence
   */
  private addNode(
    origin: ConnectableEntryComponent,
    columnIndex: number,
    nodeType: NodeType,
    nodeCategory: NodeCategory,
  ): ComponentRef<NodeDirective> {
    if (this.columnContainer && this.columns.length <= columnIndex) {
      const newColumn = this.renderer.createElement('div') as HTMLElement;
      newColumn.classList.add(COLUMN_CLASS);
      this.renderer.appendChild(this.columnContainer.nativeElement, newColumn);
      this.columns.push(newColumn);
    }

    const column: HTMLElement = this.columns[columnIndex];
    let nodeRef: ComponentRef<NodeDirective> = this.getNodeRef(nodeType);
    nodeRef.setInput('origin', origin);
    nodeRef.setInput('category', nodeCategory);
    nodeRef.instance.columnIndex = columnIndex;
    this.applicationRef.attachView(nodeRef.hostView);
    column.appendChild(nodeRef.location.nativeElement);
    nodeRef.changeDetectorRef.detectChanges();
    nodeRef.instance.addNode.subscribe((data) => this.triggerNodeCreation(data.entry, data.targetColumn));
    nodeRef.instance.removeNode.subscribe(() => this.removeNodeAndLink(nodeRef, column));
    nodeRef.instance.selectNode.subscribe(() => this.selectNode(nodeRef.instance.id, nodeCategory));

    addNode(nodeRef, nodeType, nodeCategory, origin);
    origin.activeState.set(false);
    return nodeRef;
  }

  /**
   * Select a node based on its id and open the corresponding configuration form on the sidebar.
   * @param nodeId Identifier of the node to be selected
   * @param nodeCategory Node category: 'preprocess' | 'context' | 'postprocess'
   */
  private selectNode(nodeId: string, nodeCategory: NodeCategory) {
    if (!this.sidebarContentWrapper) {
      return;
    }
    this.resetState();
    const node = selectNode(nodeId, nodeCategory);
    if (!node) {
      throw new Error(`selectNode: No node with id=${nodeId} in category ${nodeCategory}`);
    }

    const container: HTMLElement = this.openSidebarWithTitle(
      `retrieval-agents.workflow.node-types.${node.nodeType}.title`,
    );
    container.classList.remove('no-form');
    const formRef = this.getFormRef(node.nodeType);
    const config = node.nodeConfig;
    if (config) {
      // For some forms like Restart, the patch won't work for all fields,
      // so we also pass the config in the form components to handle those specific cases directly there
      formRef.instance.config = config;
      formRef.instance.configForm.patchValue(config);
    }
    this.applicationRef.attachView(formRef.hostView);
    container.appendChild(formRef.location.nativeElement);
    formRef.changeDetectorRef.detectChanges();
    formRef.instance.submitForm.subscribe((config) => this.saveNodeConfiguration(config, nodeId, nodeCategory));
    formRef.instance.cancel.subscribe(() => this.closeSidebar());
    this._currentPanel = formRef;
  }

  /**
   * Save the node configuration and close the sidebar.
   * @param config Node configuration
   * @param nodeId Identifier of the node to save
   * @param nodeCategory Node category: 'preprocess' | 'context' | 'postprocess'
   */
  private saveNodeConfiguration(config: NodeConfig, nodeId: string, nodeCategory: NodeCategory) {
    updateNode(nodeId, nodeCategory, { nodeConfig: config });
    this.closeSidebar();
    // FIXME
    // const agent = node.agent;
    // let creationObs: Observable<void>;
    // let creationData = this.getAgentFromConfig(node.nodeType, config);
    // if (NODES_BY_ENTRY_TYPE['preprocess'].includes(node.nodeType)) {
    //   creationObs = this.sdk.currentArag.pipe(
    //     take(1),
    //     switchMap((arag) =>
    //       !!agent
    //         ? arag.patchPreprocess({ ...agent, ...(creationData as PreprocessAgentCreation) })
    //         : arag.addPreprocess(creationData as PreprocessAgentCreation),
    //     ),
    //   );
    // } else if (NODES_BY_ENTRY_TYPE['context'].includes(node.nodeType)) {
    //   creationObs = this.sdk.currentArag.pipe(
    //     take(1),
    //     switchMap((arag) =>
    //       !!agent
    //         ? arag.patchContext({ ...agent, ...(creationData as ContextAgentCreation) })
    //         : arag.addContext(creationData as ContextAgentCreation),
    //     ),
    //   );
    // } else if (NODES_BY_ENTRY_TYPE['postprocess'].includes(node.nodeType)) {
    //   creationObs = this.sdk.currentArag.pipe(
    //     take(1),
    //     switchMap((arag) =>
    //       !!agent
    //         ? arag.patchPostprocess({ ...agent, ...(creationData as PostprocessAgentCreation) })
    //         : arag.addPostprocess(creationData as PostprocessAgentCreation),
    //     ),
    //   );
    // } else {
    //   throw new Error(`Node type ${node.nodeType} not mapped in NODES_BY_ENTRY_TYPE`);
    // }
    // creationObs.subscribe({
    //   next: () => {
    //     node.nodeConfig = config;
    //     node.nodeRef.setInput('config', config);
    //     this.closeSidebar();
    //   },
    //   error: () => this.toaster.error(this.translate.instant('retrieval-agents.workflow.errors.save-agent')),
    // });
  }

  /**
   * Update all the links’ positions on the specified column and the next ones.
   * @param columnIndex index of the first column in which node’s links must be updated
   */
  private updateLinksOnColumn(columnIndex: number) {
    getAllNodes()
      .filter((node) => node.nodeRef.instance.columnIndex >= columnIndex)
      .forEach((node) => node.nodeRef.instance.boxComponent.updateLink());
  }

  /**
   * Open the sidebar with specified title
   * @param titleKey translation key of the sidebar title
   * @param descriptionKey translation key of the sidebar description
   * @returns the sidebar content HTML element
   */
  private openSidebarWithTitle(titleKey: string, descriptionKey?: string): HTMLElement {
    if (!this.sidebarContentWrapper) {
      throw new Error('Sidebar container not initialized');
    }
    const container: HTMLElement = this.sidebarContentWrapper.nativeElement;
    setOpenSidebar(true);
    setSidebarHeader(this.translate.instant(titleKey), descriptionKey ? this.translate.instant(descriptionKey) : '');
    return container;
  }

  /**
   * Create and return the node component corresponding to the specified node type.
   * @param nodeType Type of the node to be created
   * @returns ComponentRef<NodeDirective> corresponding to the node type.
   */
  private getNodeRef(nodeType: NodeType): ComponentRef<NodeDirective> {
    switch (nodeType) {
      case 'historical':
        return createComponent(HistoricalNodeComponent, {
          environmentInjector: this.environmentInjector,
        });
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
      case 'ask':
        return createComponent(AskNodeComponent, {
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
      default:
        throw new Error(`No node component for type ${nodeType}`);
    }
  }

  /**
   * Create and return the form component corresponding to the specified node type.
   * @param nodeType Type of the node corresponding to the form to be created
   * @returns ComponentRef<FormDirective> corresponding to the node type.
   */
  private getFormRef(nodeType: NodeType): ComponentRef<FormDirective> {
    switch (nodeType) {
      case 'historical':
        return createComponent(HistoricalFormComponent, { environmentInjector: this.environmentInjector });
      case 'rephrase':
        return createComponent(RephraseFormComponent, { environmentInjector: this.environmentInjector });
      case 'conditional':
        return createComponent(ConditionalFormComponent, { environmentInjector: this.environmentInjector });
      case 'validation':
        return createComponent(ConditionalFormComponent, { environmentInjector: this.environmentInjector });
      case 'summarize':
        return createComponent(SummarizeFormComponent, { environmentInjector: this.environmentInjector });
      case 'restart':
        return createComponent(RestartFormComponent, { environmentInjector: this.environmentInjector });
      case 'ask':
        return createComponent(AskFormComponent, { environmentInjector: this.environmentInjector });
      case 'internet':
        return createComponent(InternetFormComponent, { environmentInjector: this.environmentInjector });
      case 'sql':
        return createComponent(SqlFormComponent, { environmentInjector: this.environmentInjector });
      case 'cypher':
        return createComponent(CypherFormComponent, { environmentInjector: this.environmentInjector });
      default:
        throw new Error(`No form component for type ${nodeType}`);
    }
  }

  private getAgentFromConfig(
    nodeType: NodeType,
    config: any,
  ): PreprocessAgentCreation | ContextAgentCreation | PostprocessAgentCreation {
    switch (nodeType) {
      case 'rephrase':
        return rephraseUiToCreation(config);
      case 'internet':
        return internetUiToCreation(config);
      case 'sql':
        return sqlUiToCreation(config);
      case 'ask':
        return askUiToCreation(config);
      case 'historical':
      case 'cypher':
      case 'conditional':
      case 'validation':
      case 'summarize':
      case 'restart':
      case 'remi':
      case 'external':
        return { module: nodeType, ...config };
    }
  }

  private getConfigFromAgent(agent: PreprocessAgent | ContextAgent | PostprocessAgent): any {
    switch (agent.module) {
      case 'rephrase':
        return rephraseAgentToUi(agent as RephraseAgent);
      case 'brave':
      case 'perplexity':
      case 'tavily':
      case 'google':
        return internetAgentToUi(agent as InternetAgent);
      case 'sql':
        return sqlAgentToUi(agent as SqlAgent);
      case 'ask':
        return askAgentToUi(agent as AskAgent);
      case 'historical':
      case 'cypher':
      case 'mcp':
      case 'conditional':
      case 'restricted':
      case 'sparql':
        return { ...agent };
    }
  }
}
