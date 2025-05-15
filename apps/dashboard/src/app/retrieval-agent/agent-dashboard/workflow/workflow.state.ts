import { ComponentRef, computed, signal } from '@angular/core';
import { ConnectableEntryComponent, NodeDirective } from './basic-elements';
import { AskAgentUI, NodeCategory, NodeConfig, NodeType, ParentNode } from './workflow.models';

/**
 * Sidebar state
 */
const sidebar = signal<{ title: string; description: string; open: boolean; active: '' | 'rules' | 'add' }>({
  title: '',
  description: '',
  open: false,
  active: '',
});

export function setActiveSidebar(active: '' | 'rules' | 'add') {
  sidebar.update((bar) => ({ ...bar, active }));
}
export function setOpenSidebar(open: boolean) {
  sidebar.update((bar) => ({ ...bar, open }));
}
export function setSidebarHeader(title: string, description = '') {
  sidebar.update((bar) => ({ ...bar, title, description }));
}
export function resetSidebar() {
  sidebar.set({
    title: '',
    description: '',
    open: false,
    active: '',
  });
}
// computed signals are readonly: we don't want components to interact directly with the sidebar
export const sideBarTitle = computed(() => sidebar().title);
export const sideBarDescription = computed(() => sidebar().description);
export const sideBarOpen = computed(() => sidebar().open);
export const activeSideBar = computed(() => sidebar().active);

/**
 * Workflow state
 */
export const nodeInitialisationDone = signal(false);
const preprocessNodes = signal<{ [id: string]: ParentNode }>({});
const contextNodes = signal<{ [id: string]: ParentNode }>({});
const generationNodes = signal<{ [id: string]: ParentNode }>({});
const postprocessNodes = signal<{ [id: string]: ParentNode }>({});
const childNodes = signal<{ [id: string]: ParentNode }>({});
const selectedNode = signal<{ id: string; nodeCategory: NodeCategory } | null>(null);
const currentOrigin = signal<ConnectableEntryComponent | null>(null);
const deletedAgent = signal<{ id: string; category: NodeCategory } | null>(null);

export interface WorkflowState {
  preprocess: ParentNode[];
  context: ParentNode[];
  generation: ParentNode[];
  postprocess: ParentNode[];
  children: ParentNode[];
  deletedAgent: { id: string; category: NodeCategory } | null;
}
export const workflow = computed<WorkflowState>(() => {
  return {
    preprocess: Object.values(preprocessNodes()),
    context: Object.values(contextNodes()),
    generation: Object.values(generationNodes()),
    postprocess: Object.values(postprocessNodes()),
    children: Object.values(childNodes()),
    deletedAgent: deletedAgent(),
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
  deletedAgent.set(null);
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
 */
export function addNode(
  nodeRef: ComponentRef<NodeDirective>,
  nodeType: NodeType,
  nodeCategory: NodeCategory,
  origin: ConnectableEntryComponent,
  nodeConfig?: NodeConfig,
  agentId?: string,
  isSaved = false,
) {
  const node: ParentNode = { nodeRef, nodeType, nodeCategory, nodeConfig, agentId, isSaved };
  const nodeId = nodeRef.instance.id;
  const parentId = origin.nodeId();

  if (nodeConfig) {
    node.nodeRef.setInput('config', nodeConfig);
  }
  if (!parentId) {
    _addNode(nodeId, nodeCategory, node);
  } else {
    node.parentId = parentId;
    childNodes.update((children) => ({ ...children, [nodeRef.instance.id]: node }));
    // Reference child in parent
    const parent = getNode(parentId, nodeCategory);
    if (!parent) {
      throw new Error(`Parent ${parentId} not found in category ${nodeCategory}`);
    }
    const property = origin.id();
    if (property === 'then' || property === 'else') {
      const childIds = parent[property] || [];
      childIds.push(nodeId);
      updateNode(parentId, nodeCategory, { [property]: childIds, isSaved });
    } else if (property === 'fallback') {
      updateNode(parentId, nodeCategory, { fallback: nodeId, isSaved });
    }
  }
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
      } else if ((parentNode.then || []).includes(id)) {
        const childIds = (parentNode.then || []).filter((childId) => childId !== id);
        updateNode(parentId, nodeCategory, { then: childIds });
      } else if ((parentNode.else || []).includes(id)) {
        const childIds = (parentNode.else || []).filter((childId) => childId !== id);
        updateNode(parentId, nodeCategory, { else: childIds });
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
    // Set agent that should be deleted from the backend
    deletedAgent.set({ id: node.agentId, category: nodeCategory });
  }
  if (node && (node.then || node.else || node.fallback)) {
    const childToDelete = (node.then || []).concat(node.else || []);
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
 * Set current origin of the node in creation
 * @param origin
 */
export function setCurrentOrigin(origin: ConnectableEntryComponent) {
  currentOrigin.set(origin);
}
/**
 * Set default state on current origin if any, before removing it from the state
 */
export function resetCurrentOrigin() {
  currentOrigin()?.activeState.set(false);
  currentOrigin.set(null);
}
