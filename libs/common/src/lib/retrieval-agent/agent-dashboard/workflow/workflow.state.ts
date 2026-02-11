import { ComponentRef, computed, signal } from '@angular/core';
import { AnswerOperation, AragAnswer, AragModule, getCategoryFromModule } from '@nuclia/core';
import { ConnectableEntryComponent, NodeDirective } from './basic-elements';
import {
  AragAnswerUi,
  AskAgentUI,
  isCategory,
  NodeCategory,
  NodeConfig,
  NodeState,
  NodeType,
  ParentNode,
} from './workflow.models';

/**
 * Global state
 */
const _aragUrl = signal('');
export function setAragUrl(url: string) {
  _aragUrl.set(url);
}
export const aragUrl = computed(() => _aragUrl());

export type SidebarType = 'rules' | 'add' | 'test' | 'import' | 'export';

/**
 * Sidebar state
 */
const sidebar = signal<{
  title: string;
  description: string;
  badge: string;
  open: boolean;
  closing: boolean;
  active: '' | SidebarType;
  large: boolean;
}>({
  title: '',
  description: '',
  badge: '',
  open: false,
  closing: false,
  active: '',
  large: false,
});

export function setActiveSidebar(active: '' | SidebarType) {
  const large = active === 'test';
  sidebar.update((bar) => ({ ...bar, active, large }));
}
export function setOpenSidebar(open: boolean) {
  const closing = !open;
  sidebar.update((bar) => ({ ...bar, open, closing }));
}
export function setSidebarHeader(title: string, description = '', badge = '') {
  sidebar.update((bar) => ({ ...bar, title, description, badge }));
}
export function resetSidebar(keepOpen = false) {
  sidebar.set({
    title: '',
    description: '',
    badge: '',
    open: keepOpen ? sidebar().open : false,
    closing: false,
    active: '',
    large: false,
  });
}
// computed signals are readonly: we don't want components to interact directly with the sidebar
export const sideBarTitle = computed(() => sidebar().title);
export const sideBarDescription = computed(() => sidebar().description);
export const sideBarBadge = computed(() => sidebar().badge);
export const sideBarOpen = computed(() => sidebar().open);
export const sideBarClosing = computed(() => sidebar().closing);
export const sideBarLarge = computed(() => sidebar().large);
export const activeSideBar = computed(() => sidebar().active);

/**
 * Test agent state
 */
const testAgent = signal<{
  running: boolean;
  question: string;
  answers: AragAnswer[];
  processingPath: string;
}>({
  running: false,
  question: '',
  answers: [],
  processingPath: '',
});

// prettier-ignore
export function resetTestAgent() {
  testAgent.set({
    running: false,
    question: '',
    answers: [],
    processingPath: ''
  });
}
function aragAnswerToUi(data: AragAnswerWithModule): AragAnswerUi {
  const agentId =
    data.step?.agent_path.split('/').at(-1) ||
    data.context?.agent_id ||
    data.possible_answer?.agent_path.split('/').at(-1) ||
    null;
  return {
    module: data.module,
    answer: data.answer,
    context: data.context,
    generated_text: data.generated_text,
    operation: data.operation,
    seqid: data.seqid,
    steps: data.step ? [data.step] : [],
    agentId,
  };
}

const categories: ('preprocess' | 'context' | 'generation' | 'postprocess')[] = [
  'preprocess',
  'context',
  'generation',
  'postprocess',
];
export const testAgentRunning = computed(() => testAgent().running);
export const testAgentQuestion = computed(() => testAgent().question);
export const testAgentLastAnswer = computed(() => testAgent().answers.slice(-1)[0]);
export const testAgentHasAllAnswers = computed(() => testAgentLastAnswer().operation === AnswerOperation.done);
export const testAgentAnswersByCategory = computed(() => {
  const sortedAnswers = testAgent().answers.reduce(
    (categories, data) => {
      switch (data.operation) {
        case AnswerOperation.error:
          categories.error.push(data);
          break;
        case AnswerOperation.answer:
          addAnswerToCategory(categories, data);
          break;
        case AnswerOperation.done:
          categories.results.push(data);
          break;
        case AnswerOperation.quit:
        case AnswerOperation.start:
          return categories;
      }
      return categories;
    },
    {
      preprocess: [] as AragAnswerWithModule[],
      context: [] as AragAnswerWithModule[],
      generation: [] as AragAnswerWithModule[],
      postprocess: [] as AragAnswerWithModule[],
      error: [] as AragAnswer[],
      results: [] as AragAnswer[],
    },
  );

  const answersByCat: AnswersByCategory = {
    preprocess: [],
    context: [],
    generation: [],
    postprocess: [],
    error: sortedAnswers.error,
    results: sortedAnswers.results,
  };
  categories.forEach((category) => {
    let previousAnswer: AragAnswerUi | undefined;
    sortedAnswers[category].forEach((answer) => {
      const currentAnswer = aragAnswerToUi(answer);
      if (previousAnswer && currentAnswer.agentId === previousAnswer.agentId) {
        // grouping steps of a same module together
        if (answer.step) {
          previousAnswer.steps.push(answer.step);
        } else if (answer.context) {
          previousAnswer.context = answer.context;
        }
      } else {
        previousAnswer = currentAnswer;
        answersByCat[category].push(previousAnswer);
      }
    });
  });
  return answersByCat;
});

export interface AnswersByCategory {
  preprocess: AragAnswerUi[];
  context: AragAnswerUi[];
  generation: AragAnswerUi[];
  postprocess: AragAnswerUi[];
  error: AragAnswer[];
  results: AragAnswer[];
}
interface AragAnswerWithModule extends AragAnswer {
  module: AragModule;
}
interface RawAnswersByCategory {
  preprocess: AragAnswerWithModule[];
  context: AragAnswerWithModule[];
  generation: AragAnswerWithModule[];
  postprocess: AragAnswerWithModule[];
  error: AragAnswer[];
  results: AragAnswer[];
}

function addAnswerToCategory(categories: RawAnswersByCategory, data: AragAnswer) {
  let module: AragModule | null = null;
  if (data.step) {
    // FIXME: backend is not consitent in term of step modules for now.
    // Clean up this temporary fix once it become consisten
    module = data.step.module === 'router' ? ('ask' as AragModule) : (data.step.module as AragModule);
  } else if (data.context) {
    module = data.context.agent as AragModule;
  }
  if (module) {
    const category = getCategoryFromModule(module);
    if (category) {
      categories[category].push({ ...data, module });
    }
  }
}

export function testAgentRun(question: string, keepAnswers = false) {
  testAgent.update((state) => ({
    ...state,
    question,
    running: true,
    answers: keepAnswers ? state.answers : [],
    processingPath: keepAnswers ? state.processingPath : '',
  }));
  if (!keepAnswers) {
    resetAllNodeState();
  }
}
export function testAgentStop() {
  testAgent.update((state) => {
    if (state.processingPath) {
      setNodeStateByPath(state.processingPath, 'processed');
    }
    return { ...state, running: false };
  });
}
export function testAgentUpdateResults(answers: AragAnswer[]) {
  testAgent.update((state) => ({ ...state, answers }));
}
export function testAgentAddAnswer(answer: AragAnswer) {
  testAgent.update((state) => {
    let nodePath = state.processingPath;
    if (answer.step) {
      nodePath = answer.step.agent_path;
      if (nodePath !== state.processingPath) {
        // Set answer step node as processing
        setNodeStateByPath(nodePath, 'processing');

        if (state.processingPath !== '') {
          setNodeStateByPath(state.processingPath, 'processed');
        }
      }
    }

    return { ...state, answers: state.answers.concat([answer]), processingPath: nodePath };
  });
}

function resetAllNodeState() {
  getAllNodes(true).forEach((node) => setNodeState(node, 'default'));
}
function setNodeStateByPath(nodePath: string, state: NodeState) {
  const [, category, agentId] = nodePath.split('/');
  if (isCategory(category)) {
    const node = getNodeByAgentId(agentId, category);
    if (node) {
      setNodeState(node, state);
    }
  }
}
function setNodeState(node: ParentNode, state: NodeState) {
  node.nodeRef.setInput('state', state);
  node.nodeRef.instance.boxComponent?.linkRef?.setInput('state', state);
}

/**
 * Workflow state
 */
export const nodeInitialisationDone = signal(false);
const preprocessNodes = signal<{ [id: string]: ParentNode }>({});
const contextNodes = signal<{ [id: string]: ParentNode }>({});
const generationNodes = signal<{ [id: string]: ParentNode }>({});
const postprocessNodes = signal<{ [id: string]: ParentNode }>({});
const childNodes = signal<{ [id: string]: ParentNode }>({});
export const selectedNode = signal<{ id: string; nodeCategory: NodeCategory } | null>(null);
const currentOrigin = signal<ConnectableEntryComponent | null>(null);
export const isRegisteredAgent = signal<boolean>(false);
const deletedAgents = signal<{ id: string; category: NodeCategory }[]>([]);

export interface WorkflowState {
  preprocess: ParentNode[];
  context: ParentNode[];
  generation: ParentNode[];
  postprocess: ParentNode[];
  children: ParentNode[];
  deletedAgents: { id: string; category: NodeCategory }[];
}
export const workflow = computed<WorkflowState>(() => {
  return {
    preprocess: Object.values(preprocessNodes()),
    context: Object.values(contextNodes()),
    generation: Object.values(generationNodes()),
    postprocess: Object.values(postprocessNodes()),
    children: Object.values(childNodes()),
    deletedAgents: deletedAgents(),
  };
});

/**
 * Selected node id or undefined.
 */
export const selectedNodeId = computed(() => selectedNode()?.id);

/**
 * Reset deletedNode on state
 */
export function resetDeletedNode() {
  deletedAgents.set([]);
}

/**
 * Check if a node has at least one child in its then property
 * @param nodeId Node identifier
 * @param nodeCategory Node category: 'preprocess' | 'context' | 'generate' | 'postprocess'
 * @returns true if the node has at least one chile in its then category
 */
export function hasChildInThen(nodeId: string, nodeCategory: NodeCategory): boolean {
  const node = getNode(nodeId, nodeCategory);
  return !!node && !!node.then && node.then.length >= 1;
}

/**
 * Set selected node and returns it
 * @param id Node identifier
 * @param nodeCategory Node category: 'preprocess' | 'context' | 'generate' | 'postprocess'
 * @returns Node found or undefined
 */
export function selectNode(id: string, nodeCategory: NodeCategory): ParentNode | undefined {
  const node = getNode(id, nodeCategory);
  if (node) {
    node.nodeRef.setInput('state', 'selected');
    selectedNode.set({ id, nodeCategory });
  }
  return node;
}
/**
 * Unselect current selected node if any
 */
export function unselectNode() {
  const selection = selectedNode();
  if (selection) {
    const node = getNode(selection.id, selection.nodeCategory);
    if (node) {
      node.nodeRef.setInput('state', 'default');
    }
  }

  selectedNode.set(null);
}

/**
 * Get specific node
 * @param id Node identifier
 * @param nodeCategory Node category: 'preprocess' | 'context' | 'generate' | 'postprocess'
 * @returns The node corresponding to specified id or undefined
 */
export function getNode(id: string, nodeCategory: NodeCategory): ParentNode | undefined {
  let node;
  switch (nodeCategory) {
    case 'preprocess':
      node = preprocessNodes()[id];
      break;
    case 'context':
      node = contextNodes()[id];
      break;
    case 'generation':
      node = generationNodes()[id];
      break;
    case 'postprocess':
      node = postprocessNodes()[id];
      break;
  }
  if (!node) {
    node = childNodes()[id];
  }
  return node;
}

export function getNodeByAgentId(agentId: string, nodeCategory: NodeCategory): ParentNode | undefined {
  let node;
  switch (nodeCategory) {
    case 'preprocess':
      node = Object.values(preprocessNodes()).find((node) => node.agentId === agentId);
      break;
    case 'context':
      node = Object.values(contextNodes()).find((node) => node.agentId === agentId);
      break;
    case 'generation':
      node = Object.values(generationNodes()).find((node) => node.agentId === agentId);
      break;
    case 'postprocess':
      node = Object.values(postprocessNodes()).find((node) => node.agentId === agentId);
      break;
  }
  if (!node) {
    node = Object.values(childNodes()).find((node) => node.agentId === agentId);
  }
  return node;
}

function _isChildNode(id: string): boolean {
  return !!childNodes()[id];
}

/**
 * Get all nodes
 * @returns List of nodes from all categories.
 */
export function getAllNodes(includeChildren = false): ParentNode[] {
  let allNodes = Object.values(preprocessNodes())
    .concat(Object.values(contextNodes()))
    .concat(Object.values(generationNodes()))
    .concat(Object.values(postprocessNodes()));
  if (includeChildren) {
    allNodes = allNodes.concat(Object.values(childNodes()));
  }
  return allNodes;
}

/**
 * Add node to the specified category
 * @param nodeRef
 * @param nodeType
 * @param nodeCategory Node category: 'preprocess' | 'context' | 'generate' | 'postprocess'
 * @param origin Connectable entry of origin
 * @param nodeConfig Optional configuration of the node
 * @param isSaved Optional flag indicating the node is already saved in the backend (false by default)
 * @param agentId Optional agent identifier corresponding to the node
 * @param childIndex Index of the child in parent’s then/else list (optional)
 */
export function addNode(
  nodeRef: ComponentRef<NodeDirective>,
  nodeType: NodeType,
  nodeCategory: NodeCategory,
  origin: ConnectableEntryComponent,
  nodeConfig?: NodeConfig,
  agentId?: string,
  isSaved = false,
  childIndex?: number,
) {
  const node: ParentNode = { nodeRef, nodeType, nodeCategory, nodeConfig, agentId, isSaved, childIndex };
  const nodeId = nodeRef.instance.id;
  const parentId = origin.nodeId();

  if (nodeConfig) {
    node.nodeRef.setInput('config', nodeConfig);
  }
  if (!parentId) {
    _addNode(nodeId, nodeCategory, node);
  } else {
    const property = origin.id();
    const propertyConfigKey = getConfigPropertyKey(property);
    const propertyStateKey = toStatePropertyKey(propertyConfigKey);

    node.parentId = parentId;
    node.parentLinkType = property;
    node.parentLinkConfigProperty = propertyConfigKey;
    const parent = getNode(parentId, nodeCategory);
    if (!parent) {
      throw new Error(`Parent ${parentId} not found in category ${nodeCategory}`);
    }
    if (
      propertyStateKey === 'then' ||
      propertyStateKey === 'else' ||
      propertyStateKey === 'agents' ||
      propertyStateKey === 'registeredAgents'
    ) {
      const existing = (parent as any)?.[propertyStateKey];
      const childIds = Array.isArray(existing) ? [...existing] : [];
      const currentIndex = childIds.indexOf(nodeId);
      if (currentIndex !== -1) {
        childIds.splice(currentIndex, 1);
      }
      const insertionIndex =
        typeof childIndex === 'number' && childIndex >= 0 && childIndex <= childIds.length
          ? childIndex
          : childIds.length;
      childIds.splice(insertionIndex, 0, nodeId);
      node.childIndex = insertionIndex;
      if (propertyStateKey === 'registeredAgents') {
        console.log('set params');
        childNodes.update((children) => ({
          ...children,
          [nodeId]: { ...node, registeredAgentParams: { description: 'TBD' } },
        }));
      } else {
        childNodes.update((children) => ({ ...children, [nodeId]: { ...node } }));
      }
      updateNode(parentId, nodeCategory, { [propertyStateKey]: childIds, isSaved });
    } else {
      childNodes.update((children) => ({ ...children, [nodeId]: node }));
      updateNode(parentId, nodeCategory, { [propertyStateKey]: nodeId, isSaved });
    }
  }
}

function getConfigPropertyKey(property: string): string {
  return property;
}

function toStatePropertyKey(property: string): string {
  if (!property) {
    return property;
  }
  const trimmed = property.replace(/[_-]+$/g, '');
  return trimmed.replace(/[_-]+([a-zA-Z0-9])/g, (_match, char: string) => char.toUpperCase());
}

function _addNode(id: string, nodeCategory: NodeCategory, node: ParentNode) {
  switch (nodeCategory) {
    case 'preprocess':
      preprocessNodes.update((_nodes) => ({ ..._nodes, [id]: node }));
      break;
    case 'context':
      contextNodes.update((_nodes) => ({ ..._nodes, [id]: node }));
      break;
    case 'generation':
      generationNodes.update((_nodes) => ({ ..._nodes, [id]: node }));
      break;
    case 'postprocess':
      postprocessNodes.update((_nodes) => ({ ..._nodes, [id]: node }));
      break;
  }
}

/**
 * Delete node
 * @param id Node identifier
 * @param nodeCategory Node category: 'preprocess' | 'context' | 'generate' | 'postprocess'
 * @param parentId Parent node identifier if any
 * @returns the list of children’s nodeRef deleted. Warning: this list includes the nodeRef corresponding to the node identifier if corresponding node is also a child
 */
export function deleteNode(
  id: string,
  nodeCategory: NodeCategory,
  parentId?: string | null,
): ComponentRef<NodeDirective>[] {
  if (selectedNode()?.id === id) {
    unselectNode();
  }
  // remove ref from parent
  if (parentId) {
    const parentNode = getNode(parentId, nodeCategory);
    if (parentNode) {
      if (parentNode.fallback === id) {
        const nodeConfig = parentNode.nodeConfig as AskAgentUI;
        nodeConfig.fallback = null;
        updateNode(parentId, nodeCategory, { fallback: undefined, nodeConfig });
      } else if (parentNode.nextAgent === id) {
        const partial: Partial<ParentNode> = { nextAgent: undefined };
        if (parentNode.nodeConfig) {
          const nodeConfig = { ...parentNode.nodeConfig } as any;
          nodeConfig.next_agent = null;
          partial.nodeConfig = nodeConfig;
        }
        updateNode(parentId, nodeCategory, partial);
      } else if ((parentNode.then || []).includes(id)) {
        const childIds = (parentNode.then || []).filter((childId) => childId !== id);
        updateNode(parentId, nodeCategory, { then: childIds });
      } else if ((parentNode.else || []).includes(id)) {
        const childIds = (parentNode.else || []).filter((childId) => childId !== id);
        updateNode(parentId, nodeCategory, { else: childIds });
      } else if ((parentNode.agents || []).includes(id)) {
        const childIds = (parentNode.agents || []).filter((childId) => childId !== id);
        updateNode(parentId, nodeCategory, { agents: childIds });
      }
    }
  }

  const isChild = _isChildNode(id);
  let childrenRefs: ComponentRef<NodeDirective>[] = [];
  let nodeSignal;
  if (isChild) {
    nodeSignal = childNodes;
  } else {
    switch (nodeCategory) {
      case 'preprocess':
        nodeSignal = preprocessNodes;
        break;
      case 'context':
        nodeSignal = contextNodes;
        break;
      case 'generation':
        nodeSignal = generationNodes;
        break;
      case 'postprocess':
        nodeSignal = postprocessNodes;
        break;
    }
  }
  const nodeList = nodeSignal();
  const node = nodeList[id];
  if (isChild) {
    childrenRefs.push(node.nodeRef);
  } else if (node.agentId) {
    const id = node.agentId;
    // Set agent that should be deleted from the backend
    deletedAgents.update((deleted) => [...deleted, { id, category: nodeCategory }]);
  }
  if (node && (node.then || node.else || node.agents || node.fallback)) {
    const childToDelete = (node.then || []).concat(node.else || []).concat(node.agents || []);
    if (node.fallback) {
      childToDelete.push(node.fallback);
    }
    childToDelete.forEach((nodeId) => {
      childrenRefs = childrenRefs.concat(deleteNode(nodeId, nodeCategory));
    });
  }
  // Get nodes again as the list might have changed if there was children to delete
  const _nodes = nodeSignal();
  delete _nodes[id];
  nodeSignal.set({ ..._nodes });
  return childrenRefs;
}

/**
 * Delete all nodes
 */
export function resetNodes() {
  preprocessNodes.set({});
  contextNodes.set({});
  generationNodes.set({});
  postprocessNodes.set({});
  childNodes.set({});
}

/**
 * Update node
 * @param id Node identifier
 * @param nodeCategory Node category: 'preprocess' | 'context' | 'generate' | 'postprocess'
 * @param partialNode Partial node updated
 */
export function updateNode(id: string, nodeCategory: NodeCategory, partialNode: Partial<ParentNode>) {
  const node = getNode(id, nodeCategory);
  if (!node) {
    throw new Error(`updateNode: Node ${id} not found.`);
  }

  const isChild = _isChildNode(id);
  const updatedNode = { ...node, ...partialNode, isSaved: partialNode.isSaved || false };

  if (partialNode.nodeConfig) {
    const childIdsToMark = [updatedNode.fallback, updatedNode.nextAgent].filter(
      (childId): childId is string => typeof childId === 'string' && childId.length > 0,
    );

    if (childIdsToMark.length > 0) {
      childNodes.update((_nodes) => {
        let workingNodes = _nodes;

        childIdsToMark.forEach((childId) => {
          const childNode = workingNodes[childId];
          if (!childNode || childNode.isSaved === false) {
            return;
          }
          workingNodes = { ...workingNodes, [childId]: { ...childNode, isSaved: false } };
        });

        return workingNodes;
      });
    }
  }

  // if (node.registeredAgents) {
  //   console.log('has reg');
  //   const regAgents = node.registeredAgents.map((id) => ({ agent: childNodes()[id].nodeConfig, description: 'tbd' }));
  //   console.log(regAgents);
  //   node.registered_agents = regAgents.filter((a) => !!a.agent) as { agent: NodeConfig; description: string }[];
  // }

  if (isChild) {
    childNodes.update((_nodes) => ({ ..._nodes, [id]: updatedNode }));
  } else {
    switch (nodeCategory) {
      case 'preprocess':
        preprocessNodes.update((_nodes) => ({ ..._nodes, [id]: updatedNode }));
        break;
      case 'context':
        contextNodes.update((_nodes) => ({ ..._nodes, [id]: updatedNode }));
        break;
      case 'generation':
        generationNodes.update((_nodes) => ({ ..._nodes, [id]: updatedNode }));
        break;
      case 'postprocess':
        postprocessNodes.update((_nodes) => ({ ..._nodes, [id]: updatedNode }));
        break;
    }
  }

  if (partialNode.nodeConfig) {
    node.nodeRef.setInput('config', partialNode.nodeConfig);
  }
}

/**
 * Update two nodes at once: parent and child
 * @param nodeCategory Node category of both nodes
 * @param parent Parent id and partial node to save
 * @param children Children list of id and index to save
 */
export function updateParentAndChild(
  nodeCategory: NodeCategory,
  parent: { id: string; partialNode: Partial<ParentNode> },
  children: { id: string; childIndex?: number }[],
) {
  children.forEach((child) => {
    const childNode = childNodes()[child.id];
    if (childNode) {
      childNodes.update((_nodes) => ({
        ..._nodes,
        [child.id]: { ...childNode, childIndex: child.childIndex, isSaved: true },
      }));
    }
  });
  updateNode(parent.id, nodeCategory, parent.partialNode);
}

/**
 * Set current origin of the node in creation
 * @param origin
 */
export function setCurrentOrigin(origin: ConnectableEntryComponent) {
  currentOrigin.set(origin);
  isRegisteredAgent.set(origin.id() === 'registered_agents');
}
export function resetIsRegisteredAgent() {
  isRegisteredAgent.set(false);
}
/**
 * Set default state on current origin if any, before removing it from the state
 */
export function resetCurrentOrigin() {
  currentOrigin()?.activeState.set(false);
  currentOrigin.set(null);
}
