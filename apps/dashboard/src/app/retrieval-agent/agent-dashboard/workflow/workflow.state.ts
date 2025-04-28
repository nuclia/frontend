import { ComponentRef, signal } from '@angular/core';
import { ContextAgent, PostprocessAgent, PreprocessAgent } from '@nuclia/core';
import { ConnectableEntryComponent, NodeDirective } from './basic-elements';
import { Node, NodeCategory, NodeConfig, NodeType } from './workflow.models';

// TODO sidebar state

// Workflow state
export const nodes = signal<{ [id: string]: Node }>({});
export const selectedNode = signal('');
export const currentOrigin = signal<ConnectableEntryComponent | null>(null);
export const parentNode = signal<Node | null>(null);

/**
 * Set selected node and returns it
 * @param id
 * @returns
 */
export function selectNode(id: string): Node | undefined {
  const node = getNode(id);
  if (node) {
    node.nodeRef.setInput('state', 'selected');
    selectedNode.set(id);
  }
  return node;
}
/**
 * Unselect current selected node if any
 */
export function unselectNode() {
  const node = getNode(selectedNode());
  if (node) {
    node.nodeRef.setInput('state', 'default');
  }
  selectedNode.set('');
}

/**
 * Get the list of all nodes
 * @returns node list
 */
export function getNodes(): Node[] {
  return Object.values(nodes());
}

/**
 * Get specific node
 * @param id Node identifier
 * @returns The node corresponding to specified id or undefined
 */
export function getNode(id: string): Node | undefined {
  return nodes()[id];
}

/**
 * Add node
 * @param nodeRef
 * @param nodeType
 */
export function addNode(nodeRef: ComponentRef<NodeDirective>, nodeType: NodeType, nodeCategory: NodeCategory) {
  nodes.update((items) => ({ ...items, [nodeRef.instance.id]: { nodeRef, nodeType, nodeCategory, children: [] } }));
}

/**
 * Update node with agent and config
 * @param id
 * @param agent
 * @param nodeConfig
 */
export function updateNode(
  id: string,
  agent: PreprocessAgent | ContextAgent | PostprocessAgent,
  nodeConfig: NodeConfig,
) {
  const node = getNode(id);
  if (node) {
    nodes.update((items) => ({ ...items, [id]: { ...node, agent, nodeConfig } }));
    node.nodeRef.setInput('config', nodeConfig);
  }
}

/**
 * Set node config in the state and the corresponding nodeRef
 * @param id
 * @param config
 */
export function setNodeConfig(id: string, config: NodeConfig) {
  const node = getNode(id);
  if (node) {
    node.nodeRef.setInput('config', config);
    nodes.update((items) => ({ ...items, [id]: { ...node, nodeConfig: config } }));
  }
}

/**
 * Delete node specified
 * @param id Node identifier
 */
export function deleteNode(id: string) {
  if (selectedNode() === id) {
    unselectNode();
  }
  const _nodes = nodes();
  delete _nodes[id];
  nodes.set(_nodes);
}

/**
 * Delete all nodes
 */
export function resetNodes() {
  nodes.set({});
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

export function setParentNode(node: Node) {
  parentNode.set(node);
}
export function getParentNode(): Node | null {
  return parentNode();
}
export function resetParentNode() {
  parentNode.set(null);
}

export function addChild(parentId: string, child: Node) {
  const parent = getNode(parentId);
  if (parent) {
    nodes.update((items) => ({ ...items, [parentId]: { ...parent, children: [...parent.children, child] } }));
  }
}
