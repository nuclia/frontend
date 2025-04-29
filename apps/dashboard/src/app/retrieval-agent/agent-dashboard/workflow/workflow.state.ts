import { ComponentRef, computed, signal } from '@angular/core';
import { ConnectableEntryComponent, NodeDirective } from './basic-elements';
import { NodeCategory, NodeConfig, NodeType, ParentNode } from './workflow.models';

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
const preprocessNodes = signal<{ [id: string]: ParentNode }>({});
const contextNodes = signal<{ [id: string]: ParentNode }>({});
const postprocessNodes = signal<{ [id: string]: ParentNode }>({});
const selectedNode = signal<{ id: string; nodeCategory: NodeCategory } | null>(null);
const currentOrigin = signal<ConnectableEntryComponent | null>(null);

export const workflow = computed(() => {
  return {
    preprocess: preprocessNodes(),
    context: contextNodes(),
    postprocess: postprocessNodes(),
  };
});

/**
 * Set selected node and returns it
 * @param id Node identifier
 * @param nodeCategory Node category: 'preprocess' | 'context' | 'postprocess'
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
 * @param nodeCategory Node category: 'preprocess' | 'context' | 'postprocess'
 * @returns The node corresponding to specified id or undefined
 */
export function getNode(id: string, nodeCategory: NodeCategory): ParentNode | undefined {
  switch (nodeCategory) {
    case 'preprocess':
      return preprocessNodes()[id];
    case 'context':
      return contextNodes()[id];
    case 'postprocess':
      return postprocessNodes()[id];
  }
}
/**
 * Get all nodes
 * @returns List of nodes from all categories.
 */
export function getAllNodes(): ParentNode[] {
  return Object.values(preprocessNodes())
    .concat(Object.values(contextNodes()))
    .concat(Object.values(postprocessNodes()));
}
/**
 * Add node to the specified category
 * @param nodeRef
 * @param nodeType
 * @param nodeCategory Node category: 'preprocess' | 'context' | 'postprocess'
 * @param nodeConfig Optional: Node configuration from Agent
 */
export function addNode(
  nodeRef: ComponentRef<NodeDirective>,
  nodeType: NodeType,
  nodeCategory: NodeCategory,
  nodeConfig?: NodeConfig,
) {
  const node = { nodeRef, nodeType, nodeCategory, nodeConfig };
  switch (nodeCategory) {
    case 'preprocess':
      preprocessNodes.update((_nodes) => ({ ..._nodes, [nodeRef.instance.id]: node }));
      break;
    case 'context':
      contextNodes.update((_nodes) => ({ ..._nodes, [nodeRef.instance.id]: node }));
      break;
    case 'postprocess':
      postprocessNodes.update((_nodes) => ({ ..._nodes, [nodeRef.instance.id]: node }));
      break;
  }
}

/**
 * Delete node
 * @param id Node identifier
 * @param nodeCategory Node category: 'preprocess' | 'context' | 'postprocess'
 */
export function deleteNode(id: string, nodeCategory: NodeCategory) {
  if (selectedNode()?.id === id) {
    unselectNode();
  }
  let nodeSignal;
  switch (nodeCategory) {
    case 'preprocess':
      nodeSignal = preprocessNodes;
      break;
    case 'context':
      nodeSignal = contextNodes;
      break;
    case 'postprocess':
      nodeSignal = postprocessNodes;
      break;
  }
  const _nodes = nodeSignal();
  delete _nodes[id];
  nodeSignal.set(_nodes);
}

/**
 * Delete all nodes
 */
export function resetNodes() {
  preprocessNodes.set({});
  contextNodes.set({});
  postprocessNodes.set({});
}

/**
 * Update node
 * @param id Node identifier
 * @param nodeCategory Node category: 'preprocess' | 'context' | 'postprocess'
 * @param partialNode Partial node updated
 */
export function updateNode(id: string, nodeCategory: NodeCategory, partialNode: Partial<ParentNode>) {
  const node = getNode(id, nodeCategory);
  if (node) {
    switch (nodeCategory) {
      case 'preprocess':
        preprocessNodes.update((_nodes) => ({ ..._nodes, [id]: { ...node, ...partialNode } }));
        break;
      case 'context':
        contextNodes.update((_nodes) => ({ ..._nodes, [id]: { ...node, ...partialNode } }));
        break;
      case 'postprocess':
        postprocessNodes.update((_nodes) => ({ ..._nodes, [id]: { ...node, ...partialNode } }));
        break;
    }
    if (partialNode.nodeConfig) {
      node.nodeRef.setInput('config', partialNode.nodeConfig);
    }
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
