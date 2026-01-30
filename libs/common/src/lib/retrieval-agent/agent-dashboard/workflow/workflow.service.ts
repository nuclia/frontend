import {
  ApplicationRef,
  ComponentRef,
  createComponent,
  ElementRef,
  EventEmitter,
  inject,
  Injectable,
  QueryList,
  Renderer2,
  RendererFactory2,
  Type,
} from '@angular/core';
import { NavigationService, SDKService } from '@flaps/core';
import { ModalService } from '@guillotinaweb/pastanaga-angular';
import { TranslateService } from '@ngx-translate/core';
import {
  Driver,
  SomeAgent,
  NucliaDBDriver,
  KnowledgeBox,
  SearchConfigs,
  LearningConfigurations,
  GenerativeProviders,
} from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  filter,
  forkJoin,
  map,
  Observable,
  of,
  switchMap,
  take,
  tap,
} from 'rxjs';
import {
  ConnectableEntryComponent,
  FormDirective,
  LinkService,
  NodeDirective,
  NodeSelectorComponent,
} from './basic-elements';
import { AskFormComponent } from './nodes/ask/ask-form.component';
import { ExternalFormComponent } from './nodes/external/external-form.component';
import { GuardrailsFormComponent } from './nodes/guardrails/guardrails-form.component';
import { RephraseFormComponent } from './nodes/rephrase/rephrase-form.component';
import { RulesPanelComponent, TestPanelComponent } from './sidebar';
import {
  getConfigFromAgent,
  getNodeTypeFromAgent,
  isCondionalNode,
  NODE_SELECTOR_ICONS,
  NodeCategory,
  NodeConfig,
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
  SidebarType,
  unselectNode,
  updateNode,
} from './workflow.state';
import { NodeFormComponent } from './basic-elements/node-form/node-form.component';
import { DynamicNodeComponent } from './basic-elements/dynamic-node/dynamic-node.component';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { JSONSchema4 } from 'json-schema';
import { convertNodeTypeToConfigTitle } from './workflow.utils';
import { AdvancedAskFormComponent } from './nodes/advanced-ask';

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

  // Shared schemas state
  private _schemasSubject = new BehaviorSubject<JSONSchema4 | null>(null);
  schemas$ = this._schemasSubject.asObservable();

  // Shared Models state
  private _modelSchemasSubject = new BehaviorSubject<LearningConfigurations | null>(null);
  modelSchemas$ = this._modelSchemasSubject.asObservable();
  semanticModels$ = this._modelSchemasSubject.pipe(map((schemas) => schemas?.['semantic_models']?.options || []));

  private _generativeProvidersSubject = new BehaviorSubject<GenerativeProviders | null>(null);
  generativeProviders$ = this._generativeProvidersSubject.asObservable();

  // Driver Model state
  private _driverModelsSubject = new BehaviorSubject<Driver[] | null>(null);
  driverModels$ = this._driverModelsSubject.asObservable();

  private columns: HTMLElement[] = [];

  private _workflowRoot?: WorkflowRoot;
  private _columnContainer?: ElementRef;
  private _currentPanel?: ComponentRef<RulesPanelComponent | FormDirective | TestPanelComponent>;

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
    agent: SomeAgent,
    columnIndex = 1,
    childIndex?: number,
  ) {
    const nodeType = getNodeTypeFromAgent(agent);
    const config = getConfigFromAgent(agent);
    const nodeRef = this.addNode(rootEntry, columnIndex, nodeType, nodeCategory, config, agent.id, true, childIndex);

    // Ensure the node is fully rendered before attempting to create child nodes
    nodeRef.changeDetectorRef.detectChanges();

    // Use requestAnimationFrame to ensure DOM is fully updated
    requestAnimationFrame(() => {
      // Generic child node creation based on agent properties
      this.createChildNodesGeneric(nodeRef, agent, nodeCategory, columnIndex);
    });
  }

  /**
   * Generic method to create child nodes for any agent type based on actual connectable entries
   */
  private createChildNodesGeneric(
    nodeRef: ComponentRef<NodeDirective>,
    agent: SomeAgent,
    nodeCategory: NodeCategory,
    columnIndex: number,
  ) {
    // Use a more robust polling approach to ensure connectable entries are available
    this.waitForConnectableEntries(nodeRef, agent, nodeCategory, columnIndex, 0);
  }

  /**
   * Poll for connectable entries with exponential backoff and maximum attempts
   */
  private waitForConnectableEntries(
    nodeRef: ComponentRef<NodeDirective>,
    agent: SomeAgent,
    nodeCategory: NodeCategory,
    columnIndex: number,
    attempt: number,
  ) {
    const maxAttempts = 10;
    const baseDelay = 50;
    const maxDelay = 500;

    if (attempt >= maxAttempts) {
      // Fallback: try to create child nodes based on configuration alone
      this.createChildNodesFromConfig(nodeRef, agent, nodeCategory, columnIndex);
      return;
    }

    const boxComponent = nodeRef.instance.boxComponent;
    const connectableEntries = boxComponent?.connectableEntries;

    // Check multiple conditions to ensure the component is fully ready
    const isReady =
      boxComponent && connectableEntries && connectableEntries.length > 0 && nodeRef.location.nativeElement.isConnected; // Ensure DOM is connected

    if (isReady) {
      // Success! Process the entries
      this.processConnectableEntries(connectableEntries, agent, nodeCategory, columnIndex);
      return;
    }

    // Calculate delay with exponential backoff, capped at maxDelay
    const delay = Math.min(baseDelay * Math.pow(1.5, attempt), maxDelay);

    setTimeout(() => {
      this.waitForConnectableEntries(nodeRef, agent, nodeCategory, columnIndex, attempt + 1);
    }, delay);
  }

  /**
   * Process connectable entries and create child nodes
   */
  private processConnectableEntries(
    connectableEntries: QueryList<ConnectableEntryComponent>,
    agent: SomeAgent,
    nodeCategory: NodeCategory,
    columnIndex: number,
  ) {
    // For each connectable entry that exists on the node, check if the agent has corresponding child data
    connectableEntries.forEach((entry) => {
      const entryId = entry.id();

      // Check if the agent has data for this connectable entry
      const childAgents = this.getChildAgentsForEntry(agent, entryId);

      if (childAgents) {
        // Handle both single child and array of children
        const children = Array.isArray(childAgents) ? childAgents : [childAgents];
        children.forEach((child, index) => {
          this.createNodeFromSavedWorkflow(
            entry,
            nodeCategory,
            child,
            columnIndex + 1,
            Array.isArray(childAgents) ? index : undefined,
          );
        });
      }
    });
  }

  /**
   * Fallback method to create child nodes when connectable entries are not available
   * This method works directly with the agent configuration
   */
  private createChildNodesFromConfig(
    nodeRef: ComponentRef<NodeDirective>,
    agent: SomeAgent,
    nodeCategory: NodeCategory,
    columnIndex: number,
  ) {
    // Common connectable properties that typically contain child agents
    const connectableProperties = ['fallback', 'next_agent', 'then', 'else_', 'else', 'agents'];

    connectableProperties.forEach((propertyName) => {
      const childAgents = this.getChildAgentsForEntry(agent, propertyName);
      if (childAgents) {
        // We need to simulate a connectable entry for the child creation
        // This is a fallback, so we create a minimal entry object
        const mockEntry = {
          id: () => propertyName,
          category: () => nodeCategory,
          nodeId: () => nodeRef.instance.id,
        } as ConnectableEntryComponent;

        const children = Array.isArray(childAgents) ? childAgents : [childAgents];
        children.forEach((child, index) => {
          this.createNodeFromSavedWorkflow(
            mockEntry,
            nodeCategory,
            child,
            columnIndex + 1,
            Array.isArray(childAgents) ? index : undefined,
          );
        });
      }
    });
  }

  /**
   * Get child agents for a specific connectable entry by examining the agent's configuration
   * This method is completely generic and works with any agent structure
   */
  private getChildAgentsForEntry(agent: SomeAgent, entryId: string): any[] | any | null {
    // Direct property match (e.g., 'fallback' entry maps to agent.fallback)
    const child = (agent as unknown as any)[entryId];
    if (child && this.isValidChildAgent(child)) {
      return child;
    }
    return null;
  }

  /**
   * Validate if a value represents valid child agent(s)
   */
  private isValidChildAgent(value: any): boolean {
    if (!value) return false;

    // Single agent object
    if (typeof value === 'object' && !Array.isArray(value) && value.module) {
      return true;
    }

    // Array of agents
    if (Array.isArray(value) && value.length > 0) {
      return value.every((item) => item && typeof item === 'object' && item.module);
    }

    return false;
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

    // Check if this connectable entry has discriminator options
    const discriminatorOptions = this.getDiscriminatorOptions(origin);

    const container: HTMLElement = this.openSidebarWithTitle(
      `retrieval-agents.workflow.sidebar.node-creation.${originCategory}`,
    );
    container.classList.add('no-form');

    if (discriminatorOptions.length > 0) {
      // Display discriminator-specific options
      this.displayDiscriminatorNodes(discriminatorOptions, container, origin, columnIndex, originCategory);
    } else {
      // Fall back to category-based options
      this.displayPossibleNodes(originCategory, container, origin, columnIndex);
    }
  }

  /**
   * Get discriminator options for a connectable entry by examining the parent node's schema
   */
  private getDiscriminatorOptions(origin: ConnectableEntryComponent): string[] {
    const nodeId = origin.nodeId();
    const entryId = origin.id();

    if (!nodeId) {
      return [];
    }

    // Find the parent node
    const allNodes = getAllNodes(true);
    const parentNode = allNodes.find((node) => node.nodeRef.instance.id === nodeId);
    if (!parentNode) {
      return [];
    }

    // Get the schemas
    const schemas = this._schemasSubject.getValue();
    if (!schemas) {
      return [];
    }

    // Get the node type and category
    const nodeType = parentNode.nodeType;
    const nodeCategory = parentNode.nodeCategory;

    // Find the schema for this node type
    const categorySchemas = schemas.properties?.[nodeCategory];
    if (!categorySchemas) {
      return [];
    }

    const schemaTitle = convertNodeTypeToConfigTitle(nodeType, this._schemasSubject.getValue());
    const matchingSchema = schemas['$defs'][schemaTitle];

    if (!matchingSchema?.properties) {
      return [];
    }

    // Look for the property that matches this connectable entry
    const property = matchingSchema.properties[entryId];
    if (!property) {
      return [];
    }

    // Extract discriminator mapping from the property
    return this.extractDiscriminatorMapping(property);
  }

  /**
   * Extract discriminator mapping from a schema property
   */
  private extractDiscriminatorMapping(property: any): string[] {
    // Check direct discriminator
    if (property.discriminator?.mapping) {
      return Object.keys(property.discriminator.mapping);
    }

    // Check anyOf for discriminator
    if (property.anyOf && Array.isArray(property.anyOf)) {
      for (const item of property.anyOf) {
        if (item.discriminator?.mapping) {
          return Object.keys(item.discriminator.mapping);
        }
      }
    }

    // Check oneOf for discriminator
    if (property.oneOf && Array.isArray(property.oneOf)) {
      for (const item of property.oneOf) {
        if (item.discriminator?.mapping) {
          return Object.keys(item.discriminator.mapping);
        }
      }
    }

    // Check if it's an array type with items that have discriminators
    if (property.type === 'array' && property.items) {
      const items = property.items;

      // Check direct discriminator on items
      if (items.discriminator?.mapping) {
        return Object.keys(items.discriminator.mapping);
      }

      // Check discriminators in items' anyOf/oneOf
      if (items.anyOf && Array.isArray(items.anyOf)) {
        for (const item of items.anyOf) {
          if (item.discriminator?.mapping) {
            return Object.keys(item.discriminator.mapping);
          }
        }
      }

      if (items.oneOf && Array.isArray(items.oneOf)) {
        for (const item of items.oneOf) {
          if (item.discriminator?.mapping) {
            return Object.keys(item.discriminator.mapping);
          }
        }
      }
    }

    return [];
  }

  /**
   * Display discriminator-specific node options
   */
  private displayDiscriminatorNodes(
    discriminatorOptions: string[],
    container: HTMLElement,
    origin: ConnectableEntryComponent,
    columnIndex: number,
    originCategory: NodeCategory,
  ) {
    discriminatorOptions.forEach((nodeType, index) => {
      const selectorRef = createComponent(NodeSelectorComponent, { environmentInjector: this.environmentInjector });
      const nodeTypeKey = this.getNodeTypeKey(nodeType as NodeType);
      const schemaKey = convertNodeTypeToConfigTitle(nodeType, this._schemasSubject.getValue());
      const matchingSchema = this._schemasSubject.getValue()?.['$defs'][schemaKey];
      selectorRef.setInput('nodeType', nodeTypeKey);
      selectorRef.setInput('nodeTitle', matchingSchema?.title || '');
      selectorRef.setInput('description', matchingSchema?.description || '');
      selectorRef.setInput('icon', NODE_SELECTOR_ICONS[nodeType as NodeType]);
      this.applicationRef.attachView(selectorRef.hostView);
      container.appendChild(selectorRef.location.nativeElement);
      selectorRef.changeDetectorRef.detectChanges();
      selectorRef.instance.select.subscribe(() => {
        const nodeRef = this.addNode(origin, columnIndex, nodeType as NodeType, originCategory);
        nodeRef.location.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        this.selectNode(nodeRef.instance.id, originCategory);
      });

      if (index === discriminatorOptions.length - 1) {
        selectorRef.location.nativeElement.classList.add('last-of-section');
      }
    });
  }

  /**
   * Check if schema matches node type (helper method)
   */
  private schemaMatchesNodeType(schema: any, nodeType: string): boolean {
    // Check if the schema title matches the node type
    if (schema.title?.toLowerCase().includes(nodeType.toLowerCase().replace('_', ''))) {
      return true;
    }

    // Check if properties contain identifiers that match the node type
    if (schema.properties?.['module']) {
      const moduleProperty = schema.properties['module'];
      if (moduleProperty['const'] === nodeType || moduleProperty['default'] === nodeType) {
        return true;
      }
    }

    // Handle conditional nodes
    if (nodeType.includes('conditional') && schema.title?.toLowerCase().includes('conditional')) {
      return true;
    }

    // Handle exact module matches in $ref
    if (schema['$ref']) {
      const ref = schema['$ref'] as string;
      if (ref.startsWith('#/$defs/')) {
        const defName = ref.replace('#/$defs/', '');
        if (defName.toLowerCase().includes(nodeType.toLowerCase().replace('_', ''))) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Resolve schema $ref (helper method)
   */
  private resolveSchemaRef(rootSchema: any, ref: string, schemas: any): any {
    if (ref.startsWith('#/$defs/')) {
      const defName = ref.replace('#/$defs/', '');

      // Try to find the definition in the root schema's $defs first
      if (rootSchema['$defs'] && rootSchema['$defs'][defName]) {
        return rootSchema['$defs'][defName];
      }

      // If not found, search through all categories
      for (const [categoryName, category] of Object.entries(schemas.agents)) {
        if (Array.isArray(category)) {
          for (const schema of category) {
            if (schema['$defs'] && schema['$defs'][defName]) {
              return schema['$defs'][defName];
            }
          }
        }
      }
    }
    return null;
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
    // Get configurations directly from schemas for this category
    const categoryConfigs = this.getCategoryConfigurations(nodeCategory);

    categoryConfigs.forEach((nodeType, index) => {
      const selectorRef = createComponent(NodeSelectorComponent, { environmentInjector: this.environmentInjector });
      const nodeTypeKey = this.getNodeTypeKey(nodeType);
      const schemaKey = convertNodeTypeToConfigTitle(nodeType, this._schemasSubject.getValue());
      const matchingSchema = this._schemasSubject.getValue()?.['$defs'][schemaKey];
      selectorRef.setInput('nodeType', nodeTypeKey);
      selectorRef.setInput('nodeTitle', matchingSchema?.title || '');
      selectorRef.setInput('description', matchingSchema?.description || '');
      selectorRef.setInput('icon', NODE_SELECTOR_ICONS[nodeType]);
      this.applicationRef.attachView(selectorRef.hostView);
      container.appendChild(selectorRef.location.nativeElement);
      selectorRef.changeDetectorRef.detectChanges();
      selectorRef.instance.select.subscribe(() => {
        const nodeRef = this.addNode(origin, columnIndex, nodeType, nodeCategory);
        nodeRef.location.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        this.selectNode(nodeRef.instance.id, nodeCategory);
      });

      if (index === categoryConfigs.length - 1) {
        selectorRef.location.nativeElement.classList.add('last-of-section');
      }
    });
  }

  /**
   * Get all node configurations directly from schemas for a specific category
   */
  private getCategoryConfigurations(nodeCategory: NodeCategory): NodeType[] {
    return Object.keys(
      (this._schemasSubject.getValue()?.properties?.[nodeCategory].items as JSONSchema4)?.['discriminator'].mapping ||
        {},
    ).map((k) => k as NodeType);
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
      this._currentPanel = panelRef;
    }, 10);
  }

  /**
   * Open sidebar
   */
  openSidebar(type: SidebarType, component: Type<any>) {
    this.resetState(true);
    setActiveSidebar(type);
    const container: HTMLElement = this.openSidebarWithTitle(
      `retrieval-agents.workflow.sidebar.${type}.title`,
      `retrieval-agents.workflow.sidebar.${type}.description`,
    );
    container.classList.remove('no-form');
    const panelRef = createComponent(component, { environmentInjector: this.environmentInjector });
    this.applicationRef.attachView(panelRef.hostView);
    container.appendChild(panelRef.location.nativeElement);
    panelRef.changeDetectorRef.detectChanges();
    panelRef.instance.cancel.subscribe(() => this.closeSidebar());
    this._currentPanel = panelRef;
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
    const schemaKey = convertNodeTypeToConfigTitle(node.nodeType, this._schemasSubject.getValue());
    const matchingSchema = this._schemasSubject.getValue()?.['$defs'][schemaKey];
    const columnIndex = node.nodeRef.instance.columnIndex;
    const container: HTMLElement = this.openSidebarWithTitle(matchingSchema?.title || '');
    container.classList.remove('no-form');
    const formRef = this.getFormRef(node.nodeType, node.nodeCategory);
    formRef.setInput('category', nodeCategory);
    const config = node.nodeConfig;

    // Set config before form initialization for both dynamic and legacy forms
    if (config) {
      formRef.instance.config = config;
    }

    if ('formReady' in formRef.instance) {
      // Dynamic node-form: subscribe to formReady
      (formRef.instance.formReady as EventEmitter<FormGroup>).subscribe((configForm: FormGroup) => {
        if (config) {
          this.patchFormValuesSafely(configForm, config);
        }
      });
    } else if (config) {
      // Legacy form: patch directly if form is already initialized
      // For some forms like Restart, the patch won't work for all fields,
      // so we also pass the config in the form components to handle those specific cases directly there
      this.patchFormValuesSafely(formRef.instance.configForm, config);
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
    let childCreated = false;
    if (isCondionalNode(nodeType) && !hasChildInThen(nodeId, nodeCategory)) {
      this.addRequiredNode(nodeId, nodeCategory);
      childCreated = this.addRequiredNode(nodeId, nodeCategory);
    }

    if (!childCreated) {
      this.closeSidebar();
    }
  }

  /**
   * Trigger required child node creation
   * @param nodeId Parent node id
   * @param nodeCategory Parent node category
   */
  private addRequiredNode(nodeId: string, nodeCategory: NodeCategory): boolean {
    const node = getNode(nodeId, nodeCategory);
    if (!node) {
      throw new Error(`addRequiredNode: Node ${nodeId} not found in the state.`);
    }
    const entries = node.nodeRef.instance.boxComponent.connectableEntries;
    if (!entries) {
      return false;
    }

    const requiredEntry = entries.toArray().find((entry) => entry.required());
    if (requiredEntry) {
      requiredEntry.onOutputClick();
      return true;
    }

    return false;
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
    // If schemas are available, use the dynamic node component
    return createComponent(DynamicNodeComponent, {
      environmentInjector: this.environmentInjector,
    });
  }

  /**
   * Create and return the form component corresponding to the specified node type.
   * @param nodeType Type of the node corresponding to the form to be created
   * @returns ComponentRef<FormDirective> corresponding to the node type.
   */
  private getFormRef(nodeType: NodeType, nodeCategory: string): ComponentRef<FormDirective> {
    let nodeTypeOverride: string = nodeType;
    switch (nodeType) {
      case 'advanced_ask':
        const ref = createComponent(AdvancedAskFormComponent, { environmentInjector: this.environmentInjector });
        ref.setInput('schemas', this._schemasSubject.getValue());
        return ref;
      case 'ask':
        return createComponent(AskFormComponent, { environmentInjector: this.environmentInjector });
      case 'external':
        return createComponent(ExternalFormComponent, { environmentInjector: this.environmentInjector });
      case 'preprocess_alinia':
      case 'postprocess_alinia':
        return createComponent(GuardrailsFormComponent, { environmentInjector: this.environmentInjector });
      case 'rephrase':
        const refRephrase = createComponent(RephraseFormComponent, { environmentInjector: this.environmentInjector });
        refRephrase.setInput('schemas', this._schemasSubject.getValue());
        return refRephrase;
    }

    const defaultRef = createComponent(NodeFormComponent, { environmentInjector: this.environmentInjector });
    defaultRef.setInput('agentType', nodeCategory); // 'preprocess' | 'context' | 'generation' | 'postprocess'
    defaultRef.setInput('agentName', nodeTypeOverride); // ex: 'historical', 'rephrase', 'sql'...
    defaultRef.setInput('formGroupName', nodeTypeOverride); // ex: 'historical', 'rephrase', 'sql'...
    defaultRef.setInput('schemas', this._schemasSubject.getValue()); // Provide current schemas
    return defaultRef;
  }

  /**
   * Safely patch form values, handling FormArray controls properly
   */
  private patchFormValuesSafely(formGroup: FormGroup, config: any) {
    const patchData: any = {};

    Object.keys(config).forEach((key) => {
      const control = formGroup.get(key);
      const value = config[key];

      if (control && control instanceof FormArray) {
        // For FormArray controls, handle both array and string values
        const formArray = control as FormArray;
        let arrayValue: any[];

        if (Array.isArray(value)) {
          arrayValue = value;
        } else if (typeof value === 'string' && value.trim() !== '') {
          // Convert string to single-item array
          arrayValue = [value];
        } else if (value === null || value === undefined || value === '') {
          // Handle null/undefined/empty values as empty array
          arrayValue = [];
        } else {
          // For other types, try to convert to array
          arrayValue = [value];
        }

        // Rebuild the FormArray with the proper array values
        formArray.clear();
        arrayValue.forEach((item) => {
          formArray.push(new FormControl(item));
        });

        // Don't include in patchData since we handled it directly
      } else if (Array.isArray(value)) {
        // Skip this field to prevent forEach error in patchValue
      } else {
        // For other controls, include in regular patch
        patchData[key] = value;
      }
    });

    // Patch the remaining non-FormArray controls
    if (Object.keys(patchData).length > 0) {
      try {
        formGroup.patchValue(patchData);
      } catch (error) {
        console.error('Error patching form values:', { error, patchData, formGroup });
        // Let's also log which specific control is causing issues
        Object.entries(patchData).forEach(([key, value]) => {
          try {
            const control = formGroup.get(key);
            if (control) {
              control.patchValue(value);
              console.log('Successfully patched control individually:', key);
            }
          } catch (individualError) {
            console.error('Error patching control:', key, {
              key,
              value,
              control: formGroup.get(key),
              error: individualError,
            });
          }
        });
        throw error;
      }
    }
  }

  /**
   * Fetch models and update shared state
   */
  fetchModels() {
    return this.sdk.currentArag
      .pipe(
        take(1),
        switchMap((arag) => forkJoin([arag.getLearningSchema(), arag.getGenerativeProviders()])),
      )
      .subscribe(([schemas, providers]) => {
        this._modelSchemasSubject.next(schemas);
        this._generativeProvidersSubject.next(providers);
      });
  }

  getSchemas() {
    return this.sdk.currentArag.pipe(switchMap((arag) => arag.getFullSchemas()));
  }

  /**
   * Fetch schemas and update shared state
   */
  fetchSchemas() {
    this.getSchemas().subscribe((schemas) => {
      this._schemasSubject.next(schemas);
    });
  }

  /**
   * Fetch drivers and update shared state
   */
  fetchDrivers() {
    this.sdk.currentArag
      .pipe(
        take(1),
        switchMap((arag) => arag.getDrivers()),
      )
      .subscribe({
        next: (drivers) => this._driverModelsSubject.next(drivers),
        error: () => this.toaster.error(this.translate.instant('retrieval-agents.workflow.errors.load-drivers')),
      });
  }

  private getDriverKnowledgeBox(driverIdentifier: string): Observable<KnowledgeBox | null> {
    return this.driverModels$.pipe(
      filter((drivers) => !!drivers),
      take(1),
      map((drivers) => {
        const kbDrivers = (drivers?.filter((driver) => driver.provider === 'nucliadb') || []) as NucliaDBDriver[];
        const driver = kbDrivers.find((driver) => driverIdentifier === driver.identifier);
        return !driver
          ? null
          : new KnowledgeBox(this.sdk.nuclia, '', {
              id: driver.config.kbid,
              slug: '',
              title: '',
              zone: this.sdk.nuclia.options.zone || '',
            });
      }),
    );
  }

  /**
   * Fetch semantic models supported by a NucliaDB driver
   */
  fetchDriverSemanticModels(driverIdentifier: string) {
    return this.getDriverKnowledgeBox(driverIdentifier).pipe(
      switchMap((kb) => {
        const kbConfig = kb
          ? kb.getConfiguration().pipe(
              catchError(() => {
                // It will fail if the driver points to an external kb not owned by the user
                return of({ semantic_models: [] });
              }),
            )
          : of({ semantic_models: [] });
        return forkJoin([
          kbConfig,
          this.semanticModels$.pipe(
            filter((models) => !!models),
            take(1),
          ),
        ]);
      }),
      map(([kbConfig, semanticModelsData]) =>
        semanticModelsData.filter((model) => kbConfig['semantic_models']?.includes(model.value)),
      ),
    );
  }

  /**
   * Fetch available search configurations for a NucliaDB driver
   */
  fetchDriverSearchConfigurations(driverIdentifier: string): Observable<SearchConfigs> {
    return this.getDriverKnowledgeBox(driverIdentifier).pipe(
      switchMap((kb) =>
        kb
          ? kb.getSearchConfigs().pipe(
              catchError(() => {
                // It will fail if the driver points to an external kb not owned by the user
                return of({});
              }),
            )
          : of({}),
      ),
    );
  }
}
