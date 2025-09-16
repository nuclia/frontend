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
import { FeaturesService, NavigationService, SDKService } from '@flaps/core';
import { ModalService } from '@guillotinaweb/pastanaga-angular';
import { TranslateService } from '@ngx-translate/core';
import {
  AskAgent,
  BaseConditionalAgentCreation,
  BaseContextAgent,
  BaseGenerationAgent,
  BasePostprocessAgent,
  BasePreprocessAgent,
  BasicAskAgent,
  ContextAgent,
  GenerateAgent,
  PostprocessAgent,
  PreprocessAgent,
  McpAgent,
} from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { catchError, combineLatest, filter, forkJoin, map, Observable, of, switchMap, take, tap } from 'rxjs';
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
  BasicAskFormComponent,
  ConditionalFormComponent,
  ConditionalNodeComponent,
  CypherFormComponent,
  CypherNodeComponent,
  ExternalFormComponent,
  ExternalNodeComponent,
  GenerateFormComponent,
  GenerateNodeComponent,
  HistoricalFormComponent,
  HistoricalNodeComponent,
  InternetFormComponent,
  InternetNodeComponent,
  McpFormComponent,
  McpNodeComponent,
  RemiFormComponent,
  RemiNodeComponent,
  RephraseFormComponent,
  RephraseNodeComponent,
  RestartFormComponent,
  RestartNodeComponent,
  RestrictedFormComponent,
  RestrictedNodeComponent,
  SqlFormComponent,
  SqlNodeComponent,
  SummarizeFormComponent,
  SummarizeNodeComponent,
} from './nodes';
import { GuardrailsFormComponent, GuardrailsNodeComponent } from './nodes/guardrails';
import { RulesPanelComponent, TestPanelComponent } from './sidebar';
import {
  getConfigFromAgent,
  getNodeTypeFromAgent,
  isCondionalNode,
  NODE_SELECTOR_ICONS,
  NodeCategory,
  NodeConfig,
  NODES_BY_ENTRY_TYPE,
  FF_NODE_TYPES,
  NodeType,
  WorkflowRoot,
} from './workflow.models';
import {
  addNode,
  deleteNode,
  getAllNodes,
  getNode,
  hasChildInThen,
  nodeInitialisationDone,
  resetCurrentOrigin,
  resetNodes,
  resetSidebar,
  resetTestAgent,
  selectNode,
  setActiveSidebar,
  setAragUrl,
  setCurrentOrigin,
  setOpenSidebar,
  setSidebarHeader,
  unselectNode,
  updateNode,
} from './workflow.state';

const COLUMN_CLASS = 'workflow-col';
const COLUMN_SECTION_CLASS = 'column-section';
const SLIDE_DURATION = 800;

@Injectable({
  providedIn: 'root',
})
export class WorkflowService {
  private sdk = inject(SDKService);
  private toaster = inject(SisToastService);
  private translate = inject(TranslateService);
  private navigationService = inject(NavigationService);
  private linkService = inject(LinkService);
  private modalService = inject(ModalService);
  private applicationRef = inject(ApplicationRef);
  private rendererFactory = inject(RendererFactory2);
  private renderer: Renderer2 = this.rendererFactory.createRenderer(null, null);
  private environmentInjector = this.applicationRef.injector;
  private featureService = inject(FeaturesService);

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
    return combineLatest([this.sdk.currentAccount, this.sdk.currentArag]).pipe(
      map(([account, arag]) => {
        nodeInitialisationDone.set(false);
        setAragUrl(this.navigationService.getRetrievalAgentUrl(account.slug, arag.slug));
        return arag;
      }),
      switchMap((arag) =>
        forkJoin([
          arag.getPreprocess().pipe(
            catchError(() => {
              this.toaster.error(
                this.translate.instant('retrieval-agents.workflow.errors.loading-workflow.preprocess'),
              );
              return of([]);
            }),
          ),
          arag.getContext().pipe(
            catchError(() => {
              this.toaster.error(this.translate.instant('retrieval-agents.workflow.errors.loading-workflow.context'));
              return of([]);
            }),
          ),
          arag.getGeneration().pipe(
            catchError(() => {
              this.toaster.error(
                this.translate.instant('retrieval-agents.workflow.errors.loading-workflow.generation'),
              );
              return of([]);
            }),
          ),
          arag.getPostprocess().pipe(
            catchError(() => {
              this.toaster.error(
                this.translate.instant('retrieval-agents.workflow.errors.loading-workflow.postprocess'),
              );
              return of([]);
            }),
          ),
        ]),
      ),
      tap(([preprocess, context, generation, postprocess]) => {
        this.cleanWorkflow();
        preprocess.forEach((agent) => this.createNodeFromSavedWorkflow(root.preprocess, 'preprocess', agent));
        context.forEach((agent) => this.createNodeFromSavedWorkflow(root.context, 'context', agent));
        generation.forEach((agent) => this.createNodeFromSavedWorkflow(root.generation, 'generation', agent));
        postprocess.forEach((agent) => this.createNodeFromSavedWorkflow(root.postprocess, 'postprocess', agent));
        setTimeout(() => nodeInitialisationDone.set(true));
      }),
    );
  }

  /**
   * Update all links.
   */
  updateAllLinks() {
    this.updateLinksOnColumn(1);
  }

  /**
   * Create and add node on workflow based on what is saved in current Arag
   * @param rootEntry
   * @param nodeCategory
   * @param agent
   * @param columnIndex Column index in which the node will be placed. 1 by default
   * @param childIndex Index of the child in parent’s then/else list
   */
  private createNodeFromSavedWorkflow(
    rootEntry: ConnectableEntryComponent,
    nodeCategory: NodeCategory,
    agent:
      | BasePreprocessAgent
      | BaseContextAgent
      | BaseGenerationAgent
      | BasePostprocessAgent
      | PreprocessAgent
      | ContextAgent
      | GenerateAgent
      | PostprocessAgent,
    columnIndex = 1,
    childIndex?: number,
  ) {
    const nodeType = getNodeTypeFromAgent(agent);
    const config = getConfigFromAgent(agent);
    const nodeRef = this.addNode(rootEntry, columnIndex, nodeType, nodeCategory, config, agent.id, true, childIndex);
    if (agent.module === 'ask' || agent.module === 'basic_ask') {
      const askAgent = agent as AskAgent | BasicAskAgent;
      if (askAgent.fallback) {
        const entry = nodeRef.instance.boxComponent.connectableEntries?.find((entry) => entry.id() === 'fallback');
        if (!entry) {
          throw new Error(`No 'fallback' entry found on Ask node ${nodeRef.instance.id}`);
        }
        this.createNodeFromSavedWorkflow(entry, nodeCategory, askAgent.fallback, columnIndex + 1);
      }
    } else if (agent.module === 'mcp') {
      const mcpAgent = agent as McpAgent;
      if (mcpAgent.fallback) {
        const entry = nodeRef.instance.boxComponent.connectableEntries?.find((entry) => entry.id() === 'fallback');
        if (!entry) {
          throw new Error(`No 'fallback' entry found on MCP node ${nodeRef.instance.id}`);
        }
        this.createNodeFromSavedWorkflow(entry, nodeCategory, mcpAgent.fallback, columnIndex + 1);
      }
    } else if (isCondionalNode(agent.module)) {
      const conditionalAgent = agent as unknown as BaseConditionalAgentCreation;
      this.createChildNodes(nodeRef, 'then', nodeCategory, columnIndex, conditionalAgent);
      this.createChildNodes(nodeRef, 'else_', nodeCategory, columnIndex, conditionalAgent);
    }
  }

  private createChildNodes(
    nodeRef: ComponentRef<NodeDirective>,
    property: 'then' | 'else_',
    nodeCategory: NodeCategory,
    columnIndex: number,
    agent: BaseConditionalAgentCreation,
  ) {
    if (agent[property] && agent[property].length > 0) {
      const prop = property.replace('_', '');
      const entry = nodeRef.instance.boxComponent.connectableEntries?.find((entry) => entry.id() === prop);
      if (!entry) {
        throw new Error(`No '${prop}' entry found on conditional node ${nodeRef.instance.id}`);
      }
      agent[property].forEach((child, index) =>
        this.createNodeFromSavedWorkflow(
          entry,
          nodeCategory,
          child as PreprocessAgent | ContextAgent | PostprocessAgent,
          columnIndex + 1,
          index,
        ),
      );
    }
  }

  /**
   * Reset the workflow by removing all nodes
   */
  cleanWorkflow() {
    // Remove all nodes from the DOM
    getAllNodes(true).forEach((node) => {
      const columnIndex = node.nodeRef.instance.columnIndex;
      const column = this.columns[columnIndex];
      this._removeFromDom(node.nodeRef, column);
    });
    this.closeSidebar();
    // Reset the state
    resetNodes();
    // Reset test panel when changing workflow
    resetTestAgent();
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
    this.resetState(true);
    setActiveSidebar('add');
    const container: HTMLElement = this.openSidebarWithTitle(`retrieval-agents.workflow.sidebar.node-creation.toolbar`);
    container.classList.add('no-form');
    const sections: NodeCategory[] = ['preprocess', 'context', 'generation', 'postprocess'];
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
    this.resetState(true);

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
    this.getPossibleNodes(nodeCategory).subscribe((possibleNodes) => {
      possibleNodes.forEach((nodeType, index) => {
        const selectorRef = createComponent(NodeSelectorComponent, { environmentInjector: this.environmentInjector });
        const nodeTypeKey = this.getNodeTypeKey(nodeType);
        selectorRef.setInput(
          'nodeTitle',
          this.translate.instant(`retrieval-agents.workflow.node-types.${nodeTypeKey}.title`),
        );
        selectorRef.setInput(
          'description',
          this.translate.instant(`retrieval-agents.workflow.node-types.${nodeTypeKey}.description`),
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
    });
  }

  /**
   * Remove a node and the corresponding links from the workflow. Ask for confirmation if the node was already stored in the backend.
   * @param nodeRef Node to remove
   * @param column Column from which the node must be removed
   */
  removeNodeAndLink(nodeRef: ComponentRef<NodeDirective>, column: HTMLElement) {
    const category = nodeRef.instance.category();
    const node = getNode(nodeRef.instance.id, category);
    const agent = node?.agentId;
    if (!agent) {
      this.closeSidebar();
      this._removeNodeAndLinks(nodeRef, column);
    } else {
      this.modalService
        .openConfirm({
          title: this.translate.instant('retrieval-agents.workflow.confirm-node-deletion.title'),
          description: this.translate.instant('retrieval-agents.workflow.confirm-node-deletion.description'),
          isDestructive: true,
          confirmLabel: this.translate.instant('retrieval-agents.workflow.confirm-node-deletion.confirm-button'),
        })
        .onClose.pipe(filter((confirm) => !!confirm))
        .subscribe({
          next: () => {
            this._removeNodeAndLinks(nodeRef, column);
            this.closeSidebar();
          },
          error: () => this.toaster.error(this.translate.instant('retrieval-agents.workflow.errors.delete-agent')),
        });
    }
  }

  private _removeNodeAndLinks(nodeRef: ComponentRef<NodeDirective>, column: HTMLElement) {
    // Remove selected node
    this._removeFromDom(nodeRef, column);
    unselectNode();

    // Update state
    const nodeId = nodeRef.instance.id;
    const parentId = nodeRef.instance.origin()?.nodeId();
    const deletedChildren = deleteNode(nodeId, nodeRef.instance.category(), parentId).filter(
      (ref) => ref.instance.id !== nodeId,
    );
    // and remove corresponding children if any
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
    const category = nodeRef.instance.category();
    const section = column.querySelector(`#${category}`);
    if (!section) {
      throw new Error(`Section ${category} not found in column`);
    }
    section.removeChild(nodeRef.location.nativeElement);
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
    this.resetState(true);
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
   * Open test sidebar
   */
  openTestSidebar() {
    this.resetState(true);
    setActiveSidebar('test');
    // create the panel and open the sidebar in timeout to prevent jumping slide animation because of the large width setup
    setTimeout(() => {
      const container: HTMLElement = this.openSidebarWithTitle(`retrieval-agents.workflow.sidebar.test.title`);
      container.classList.add('no-form');
      const panelRef = createComponent(TestPanelComponent, { environmentInjector: this.environmentInjector });
      this.applicationRef.attachView(panelRef.hostView);
      container.appendChild(panelRef.location.nativeElement);
      panelRef.changeDetectorRef.detectChanges();
      panelRef.instance.cancel.subscribe(() => this.closeSidebar());
    }, 10);
  }

  /**
   * Reset state:
   * - unselect node
   * - remove current origin if any,
   * - reset sidebar title, description and content.
   * @param keepSidebarOpen Flag indicating if we should keep the sidebar open while resetting the state ()
   */
  private resetState(keepSidebarOpen = false) {
    if (!this.sidebarContentWrapper) {
      throw new Error('Sidebar container not initialized');
    }
    // Unselect node if needed
    unselectNode();

    // remove current origin if any so all outputs have their default state
    resetCurrentOrigin();

    // Reset the side bar
    const container: HTMLElement = this.sidebarContentWrapper.nativeElement;
    resetSidebar(keepSidebarOpen);
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
   * @param nodeConfig Optional configuration of the node
   * @param agent Optional agent corresponding to the node
   * @param isSaved Flag indicating if the node is already saved in the backend (false by default)
   * @param childIndex Index of the child in parent’s then/else list (optional)
   * @returns ComponentRef<NodeDirective>: Created node referrence
   */
  private addNode(
    origin: ConnectableEntryComponent,
    columnIndex: number,
    nodeType: NodeType,
    nodeCategory: NodeCategory,
    nodeConfig?: NodeConfig,
    agentId?: string,
    isSaved = false,
    childIndex?: number,
  ): ComponentRef<NodeDirective> {
    if (this.columns.length <= columnIndex) {
      this.createColumn();
    }

    const column: HTMLElement = this.columns[columnIndex];
    const section: HTMLElement | null = column.querySelector(`#${nodeCategory}`);
    if (!section) {
      throw new Error(`Section missing for category ${nodeCategory} in column ${columnIndex}`);
    }
    let nodeRef: ComponentRef<NodeDirective> = this.getNodeRef(nodeType);
    nodeRef.setInput('type', nodeType);
    nodeRef.setInput('origin', origin);
    nodeRef.setInput('category', nodeCategory);
    nodeRef.instance.columnIndex = columnIndex;
    this.applicationRef.attachView(nodeRef.hostView);
    section.appendChild(nodeRef.location.nativeElement);
    nodeRef.changeDetectorRef.detectChanges();
    nodeRef.instance.addNode.subscribe((data) => this.triggerNodeCreation(data.entry, data.targetColumn));
    nodeRef.instance.removeNode.subscribe(() => this.removeNodeAndLink(nodeRef, column));
    nodeRef.instance.selectNode.subscribe(() => this.selectNode(nodeRef.instance.id, nodeCategory));
    nodeRef.instance.configUpdated.subscribe(() => setTimeout(() => this.updateLinksOnColumn(columnIndex)));

    setTimeout(() => this.updateLinksOnColumn(columnIndex));
    addNode(nodeRef, nodeType, nodeCategory, origin, nodeConfig, agentId, isSaved, childIndex);
    origin.activeState.set(false);
    return nodeRef;
  }

  /**
   * Create a column with three sections: one for each node category.
   */
  private createColumn() {
    if (this.columnContainer) {
      const newColumn = this.renderer.createElement('div') as HTMLElement;
      newColumn.classList.add(COLUMN_CLASS);
      for (let category of ['preprocess', 'context', 'generation', 'postprocess']) {
        const section = this.renderer.createElement('div') as HTMLElement;
        section.id = category;
        section.classList.add(COLUMN_SECTION_CLASS);
        this.renderer.appendChild(newColumn, section);
      }
      this.renderer.appendChild(this.columnContainer.nativeElement, newColumn);
      this.columns.push(newColumn);
    }
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
    const columnIndex = node.nodeRef.instance.columnIndex;
    const container: HTMLElement = this.openSidebarWithTitle(
      `retrieval-agents.workflow.node-types.${this.getNodeTypeKey(node.nodeType)}.title`,
    );
    container.classList.remove('no-form');
    const formRef = this.getFormRef(node.nodeType);
    formRef.setInput('category', nodeCategory);
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
    formRef.instance.submitForm.subscribe((config) =>
      this.saveNodeConfiguration(config, nodeId, nodeCategory, node.nodeType, columnIndex),
    );
    formRef.instance.cancel.subscribe(() => this.closeSidebar());
    this._currentPanel = formRef;
  }

  private getNodeTypeKey(nodeType: NodeType): string {
    return nodeType.includes('conditional') ? 'conditional' : nodeType;
  }

  /**
   * Save the node configuration and close the sidebar.
   * @param config Node configuration
   * @param nodeId Identifier of the node to save
   * @param nodeCategory Node category: 'preprocess' | 'context' | 'postprocess'
   * @param nodeType Node type
   * @param columnIndex Column index (so we can update the links of other nodes)
   */
  private saveNodeConfiguration(
    config: NodeConfig,
    nodeId: string,
    nodeCategory: NodeCategory,
    nodeType: NodeType,
    columnIndex: number,
  ) {
    updateNode(nodeId, nodeCategory, { nodeConfig: config });
    setTimeout(() => this.updateLinksOnColumn(columnIndex));
    if (isCondionalNode(nodeType) && !hasChildInThen(nodeId, nodeCategory)) {
      this.addRequiredNode(nodeId, nodeCategory);
    } else {
      this.closeSidebar();
    }
  }

  /**
   * Trigger required child node creation
   * @param nodeId Parent node id
   * @param nodeCategory Parent node category
   */
  private addRequiredNode(nodeId: string, nodeCategory: NodeCategory) {
    const node = getNode(nodeId, nodeCategory);
    if (!node) {
      throw new Error(`addRequiredNode: Node ${nodeId} not found in the state.`);
    }
    const entries = node.nodeRef.instance.boxComponent.connectableEntries;
    if (!entries) {
      throw new Error(`addRequiredNode: no entries found for node ${nodeId}.`);
    }
    const requiredEntry = entries.find((entry) => entry.required());
    if (requiredEntry) {
      requiredEntry.onOutputClick();
    }
  }

  /**
   * Update all the links’ positions on the specified column and the next ones.
   * @param columnIndex index of the first column in which node’s links must be updated
   */
  private updateLinksOnColumn(columnIndex: number) {
    getAllNodes(true)
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
    setSidebarHeader(this.translate.instant(titleKey), descriptionKey ? this.translate.instant(descriptionKey) : '');
    setTimeout(() => setOpenSidebar(true));
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
      case 'pre_conditional':
        return createComponent(ConditionalNodeComponent, {
          environmentInjector: this.environmentInjector,
        });
      case 'context_conditional':
        return createComponent(ConditionalNodeComponent, {
          environmentInjector: this.environmentInjector,
        });
      case 'post_conditional':
        return createComponent(ConditionalNodeComponent, {
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
      case 'basic_ask':
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
      case 'remi':
        return createComponent(RemiNodeComponent, {
          environmentInjector: this.environmentInjector,
        });
      case 'external':
        return createComponent(ExternalNodeComponent, {
          environmentInjector: this.environmentInjector,
        });
      case 'restricted':
        return createComponent(RestrictedNodeComponent, {
          environmentInjector: this.environmentInjector,
        });
      case 'mcp':
        return createComponent(McpNodeComponent, {
          environmentInjector: this.environmentInjector,
        });
      case 'generate':
        return createComponent(GenerateNodeComponent, {
          environmentInjector: this.environmentInjector,
        });
      case 'preprocess_alinia':
      case 'postprocess_alinia':
        return createComponent(GuardrailsNodeComponent, {
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
      case 'pre_conditional':
        return createComponent(ConditionalFormComponent, { environmentInjector: this.environmentInjector });
      case 'context_conditional':
        return createComponent(ConditionalFormComponent, { environmentInjector: this.environmentInjector });
      case 'post_conditional':
        return createComponent(ConditionalFormComponent, { environmentInjector: this.environmentInjector });
      case 'summarize':
        return createComponent(SummarizeFormComponent, { environmentInjector: this.environmentInjector });
      case 'restart':
        return createComponent(RestartFormComponent, { environmentInjector: this.environmentInjector });
      case 'ask':
        return createComponent(AskFormComponent, { environmentInjector: this.environmentInjector });
      case 'basic_ask':
        return createComponent(BasicAskFormComponent, { environmentInjector: this.environmentInjector });
      case 'internet':
        return createComponent(InternetFormComponent, { environmentInjector: this.environmentInjector });
      case 'sql':
        return createComponent(SqlFormComponent, { environmentInjector: this.environmentInjector });
      case 'cypher':
        return createComponent(CypherFormComponent, { environmentInjector: this.environmentInjector });
      case 'remi':
        return createComponent(RemiFormComponent, { environmentInjector: this.environmentInjector });
      case 'external':
        return createComponent(ExternalFormComponent, { environmentInjector: this.environmentInjector });
      case 'restricted':
        return createComponent(RestrictedFormComponent, { environmentInjector: this.environmentInjector });
      case 'mcp':
        return createComponent(McpFormComponent, { environmentInjector: this.environmentInjector });
      case 'generate':
        return createComponent(GenerateFormComponent, { environmentInjector: this.environmentInjector });
      case 'preprocess_alinia':
      case 'postprocess_alinia':
        return createComponent(GuardrailsFormComponent, { environmentInjector: this.environmentInjector });
      default:
        throw new Error(`No form component for type ${nodeType}`);
    }
  }

  private getPossibleNodes(nodeCategory: NodeCategory): Observable<NodeType[]> {
    return forkJoin([
      this.featureService.unstable.aragAlinia.pipe(take(1)),
      this.featureService.unstable.aragCondition.pipe(take(1)),
      this.featureService.unstable.aragSql.pipe(take(1)),
      this.featureService.unstable.aragCypher.pipe(take(1)),
      this.featureService.unstable.aragRestrictedPython.pipe(take(1)),
      this.featureService.unstable.aragMcp.pipe(take(1)),
    ]).pipe(
      map(([aragAlinia, aragCondition, aragSql, aragCypher, aragRestrictedPython, aragMcp]) => {
        return (NODES_BY_ENTRY_TYPE[nodeCategory] || []).filter((nodeType) => {
          if (!FF_NODE_TYPES.includes(nodeType)) {
            return true;
          } else {
            if ((nodeType === 'preprocess_alinia' || nodeType === 'postprocess_alinia') && aragAlinia) {
              return true;
            }
            if (
              (nodeType === 'pre_conditional' ||
                nodeType === 'context_conditional' ||
                nodeType === 'post_conditional') &&
              aragCondition
            ) {
              return true;
            }
            if (nodeType === 'sql' && aragSql) {
              return true;
            }
            if (nodeType === 'cypher' && aragCypher) {
              return true;
            }
            if (nodeType === 'restricted' && aragRestrictedPython) {
              return true;
            }
            if (nodeType === 'mcp' && aragMcp) {
              return true;
            }
            return false;
          }
        });
      }),
    );
  }

  getModels() {
    const unsupportedModels = ['generative-multilingual-2023'];
    return this.sdk.currentArag.pipe(
      take(1),
      switchMap((arag) => arag.getLearningSchema()),
      map((schema) =>
        (schema?.['generative_model'].options || []).filter((model) => !unsupportedModels.includes(model.value)),
      ),
    );
  }

  getSchemas() {
    return this.sdk.currentArag.pipe(switchMap((arag) => arag.getSchemas()));
  }
}
