import { inject, Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';
import {
  BaseContextAgent,
  ContextAgentCreation,
  GenerationAgentCreation,
  PostprocessAgentCreation,
  PreprocessAgentCreation,
} from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { catchError, forkJoin, map, Observable, of, switchMap, take, tap } from 'rxjs';
import {
  BaseConditionalAgentUI,
  getAgentFromConfig,
  isCondionalNode,
  NodeCategory,
  NodeType,
  ParentNode,
  RestrictedAgentUI,
  SmartAgentUI,
} from './workflow.models';
import {
  getNode,
  nodeInitialisationDone,
  resetDeletedNode,
  selectedNodeId,
  updateNode,
  updateParentAndChild,
  workflow,
  WorkflowState,
} from './workflow.state';

@Injectable({
  providedIn: 'root',
})
export class WorkflowEffectService {
  private sdk = inject(SDKService);
  private toaster = inject(SisToastService);
  private translate = inject(TranslateService);

  initEffect() {
    const LOGS_ENABLED = true;
    if (!nodeInitialisationDone()) {
      return;
    }
    const workflowState = workflow();
    if (LOGS_ENABLED) {
      console.debug(`Effect:\n    Workflow state`, workflowState);
    }

    // First checks for updates on children, as those changes may trigger updates on the parent
    let requests: { request: Observable<void>; nodeId: string; log: string }[] = [];
    workflowState.children.forEach((node) => this.checkNodeState(node));
    if (workflowState.children.length > 0) {
      requests = this.checkForChildrenUpdates(workflowState);
    }

    // Check if there are changes to be saved in the backend
    workflowState.preprocess.forEach((node) => this.checkNodeAndUpdateRequests(node, requests));
    workflowState.context.forEach((node) => this.checkNodeAndUpdateRequests(node, requests));
    workflowState.generation.forEach((node) => this.checkNodeAndUpdateRequests(node, requests));
    workflowState.postprocess.forEach((node) => this.checkNodeAndUpdateRequests(node, requests));

    if (requests.length > 0) {
      forkJoin(
        requests.map((item) => {
          if (LOGS_ENABLED) {
            console.debug(item.log);
          }
          return item.request;
        }),
      ).subscribe();
    }

    // Check if there is a node to be deleted from the backend
    if (workflowState.deletedAgents.length > 0) {
      const requests = workflowState.deletedAgents.map((node) => this.deleteAgent(node));
      forkJoin(requests).subscribe({
        next: () => resetDeletedNode(),
        error: () => this.toaster.error(this.translate.instant('retrieval-agents.workflow.errors.delete-agent')),
      });
    }
  }

  private checkNodeAndUpdateRequests(node: ParentNode, requests: { request: Observable<void>; nodeId: string }[]) {
    const fullyConfigured = this.checkNodeState(node);
    if (fullyConfigured) {
      const data = this.checkForUpdates(node);
      if (data && !requests.find((item) => item.nodeId === data.nodeId)) {
        requests.push(data);
      }
    }
  }

  private checkNodeState(node: ParentNode): boolean {
    const fullyConfigured = this.isFullyConfigured(node);
    if (!fullyConfigured) {
      const selectedNode = selectedNodeId();
      if (selectedNode !== node.nodeRef.instance.id) {
        node.nodeRef.setInput('state', 'unsaved');
      }
    } else if (node.isSaved && node.nodeRef.instance.state() === 'unsaved') {
      node.nodeRef.setInput('state', 'default');
    }

    // Disable fallback entry when a node is already linked to it, enable it otherwise (for the case a child node has been removed)
    const singleFallbackLinked = ['fallback', 'next_agent'];
    const fallbackEntries = node.nodeRef.instance.boxComponent.connectableEntries?.filter((entry) => {
      const hasContent = !!(node.nodeConfig as any)?.[entry.id()]?.module;
      return hasContent && singleFallbackLinked.includes(entry.id());
    });
    if (fallbackEntries?.length) {
      fallbackEntries.forEach((fallbackEntry) => {
        fallbackEntry.disabledState.set(!!node.fallback);
      });
    }

    return fullyConfigured;
  }

  private isFullyConfigured(node: ParentNode): boolean {
    if (!node.nodeConfig) {
      return false;
    }

    if (isCondionalNode(node.nodeType) && this.requiresChildNodes(node.nodeType)) {
      const config = node.nodeConfig as BaseConditionalAgentUI;
      if (!Array.isArray(config.then) || config.then.length < 1) {
        return false;
      }
    }

    return true;
  }

  private requiresChildNodes(nodeType: NodeType): boolean {
    switch (nodeType) {
      case 'pre_conditional':
      case 'context_conditional':
      case 'post_conditional':
        return true;
      default:
        return false;
    }
  }

  private checkForUpdates(node: ParentNode): { request: Observable<void>; nodeId: string; log: string } | undefined {
    // Check if node is ready to be saved
    if (!this.isFullyConfigured(node)) {
      return;
    }
    const nodeId = node.nodeRef.instance.id;
    const agentId = node.agentId;
    if (!agentId) {
      const request = this.addAgent(node).pipe(
        map(({ id }) => updateNode(node.nodeRef.instance.id, node.nodeCategory, { agentId: id, isSaved: true })),
        catchError(() => {
          this.toaster.error(this.translate.instant('retrieval-agents.workflow.errors.save-agent'));
          return of();
        }),
      );
      return { request, nodeId, log: ' - Add agent' };
    } else if (!node.isSaved) {
      const request = this.updateAgent(node, agentId).pipe(
        tap(() => updateNode(node.nodeRef.instance.id, node.nodeCategory, { isSaved: true })),
        catchError(() => {
          this.toaster.error(this.translate.instant('retrieval-agents.workflow.errors.save-agent'));
          return of();
        }),
      );
      return { request, nodeId, log: ' - Update agent' };
    }
    return;
  }

  private checkForChildrenUpdates(
    workflowState: WorkflowState,
  ): { request: Observable<void>; nodeId: string; log: string }[] {
    const requests: { request: Observable<void>; nodeId: string; log: string }[] = [];
    workflowState.children
      .filter((child) => !!child.nodeConfig && !child.isSaved)
      .forEach((node) => {
        const data = this.getFullyConfiguredRootNode(node);
        if (!data) {
          return;
        }
        const { parentNode, children } = data;
        const nodeId = parentNode.nodeRef.instance.id;
        const agentId = parentNode?.agentId;
        const isAlreadyAdded = requests.some((item) => item.nodeId === nodeId);
        if (parentNode && !isAlreadyAdded) {
          if (agentId) {
            const request = this.updateAgent(parentNode, agentId).pipe(
              tap(() => {
                const partialNode = { isSaved: true };
                if (children.length > 0) {
                  updateParentAndChild(node.nodeCategory, { id: nodeId, partialNode }, children);
                }
              }),
              catchError(() => {
                this.toaster.error(this.translate.instant('retrieval-agents.workflow.errors.save-agent'));
                return of();
              }),
            );
            requests.push({ request, nodeId, log: ' - Update agent with children' });
          } else {
            const request = this.addAgent(parentNode).pipe(
              map(({ id }) => {
                const partialNode = { agentId: id, isSaved: true };
                if (children.length > 0) {
                  updateParentAndChild(node.nodeCategory, { id: nodeId, partialNode }, children);
                } else {
                  updateNode(nodeId, node.nodeCategory, partialNode);
                }
              }),
              catchError(() => {
                this.toaster.error(this.translate.instant('retrieval-agents.workflow.errors.save-agent'));
                return of();
              }),
            );
            requests.push({ request, nodeId, log: ' - Add agent with children' });
          }
        }
      });
    return requests;
  }

  private getFullyConfiguredRootNode(
    childNode: ParentNode,
  ): { parentNode: ParentNode; children: { id: string; childIndex?: number }[] } | undefined {
    if (!childNode.parentId) {
      return;
    }
    const parentNode = getNode(childNode.parentId, childNode.nodeCategory);
    let updatedChildren: { id: string; childIndex?: number }[] = [];
    if (!parentNode || !parentNode.nodeConfig) {
      return;
    }
    const childId = childNode.nodeRef.instance.id;

    if ((parentNode.then || []).includes(childId)) {
      updatedChildren.push(this.updateChildrenConfig(parentNode, childNode, 'then'));
    } else if ((parentNode.else || []).includes(childId)) {
      updatedChildren.push(this.updateChildrenConfig(parentNode, childNode, 'else_'));
    } else if ((parentNode.agents || []).includes(childId)) {
      updatedChildren.push(this.updateChildrenConfig(parentNode, childNode, 'agents'));
    } else if ((parentNode.registered_agents || []).includes(childId)) {
      updatedChildren.push(this.updateChildrenConfig(parentNode, childNode, 'registered_agents'));
    } else if (Object.keys(parentNode).includes(childId)) {
      const childConfig = getAgentFromConfig(childNode.nodeType, childNode.nodeConfig);
      const configKey = childNode.parentLinkConfigProperty || childNode.parentLinkType || childId;
      const parentConfig = parentNode.nodeConfig as unknown as Record<string, unknown>;
      parentConfig[configKey] = childConfig;
      if (configKey !== childId && childId in parentConfig) {
        delete parentConfig[childId];
      }
      updatedChildren.push({ id: childId });
    }

    if (parentNode.parentId) {
      const levelUp = this.getFullyConfiguredRootNode(parentNode);
      return levelUp
        ? { parentNode: levelUp.parentNode, children: updatedChildren.concat(levelUp.children) }
        : undefined;
    } else {
      return { parentNode, children: updatedChildren };
    }
  }

  /**
   * Update parent node children with child config for the given property. The corresponding children list will be updated.
   * @param parentNode
   * @param childNode
   * @param property then | else_
   * @returns updated child id and index in the children list
   */
  private updateChildrenConfig(
    parentNode: ParentNode,
    childNode: ParentNode,
    property: 'then' | 'else_' | 'agents' | 'registered_agents',
  ): { id: string; childIndex: number } {
    const parentConfig = parentNode.nodeConfig as BaseConditionalAgentUI | RestrictedAgentUI | SmartAgentUI;
    const children =
      property === 'agents'
        ? (parentConfig as RestrictedAgentUI).agents || []
        : property === 'registered_agents'
          ? (parentConfig as SmartAgentUI).registered_agents || []
          : (parentConfig as BaseConditionalAgentUI)[property] || [];
    const childConfig = getAgentFromConfig(childNode.nodeType, childNode.nodeConfig, childNode.agentId);
    let updatedChild;
    if (typeof childNode.childIndex === 'number') {
      children[childNode.childIndex] = { ...childConfig, id: childNode.agentId };
      updatedChild = { id: childNode.nodeRef.instance.id, childIndex: childNode.childIndex };
    } else {
      children.push(childConfig);
      const childIndex = children.length - 1;
      updatedChild = { id: childNode.nodeRef.instance.id, childIndex };
    }
    if (property === 'agents') {
      (parentConfig as RestrictedAgentUI).agents = children;
    } else if (property === 'registered_agents') {
      (parentConfig as SmartAgentUI).registered_agents = children;
    } else {
      (parentConfig as BaseConditionalAgentUI)[property] = children;
    }
    return updatedChild;
  }

  private addAgent(node: ParentNode) {
    const agentCreation = getAgentFromConfig(node.nodeType, node.nodeConfig);
    return this.sdk.currentArag.pipe(
      take(1),
      switchMap((arag) => {
        switch (node.nodeCategory) {
          case 'preprocess':
            return arag.addPreprocess(agentCreation as PreprocessAgentCreation);
          case 'context':
            return arag.addContext(agentCreation as ContextAgentCreation);
          case 'generation':
            return arag.addGeneration(agentCreation as GenerationAgentCreation);
          case 'postprocess':
            return arag.addPostprocess(agentCreation as PostprocessAgentCreation);
        }
      }),
    );
  }

  private updateAgent(node: ParentNode, agentId: string): Observable<void> {
    const agentConfig = getAgentFromConfig(node.nodeType, node.nodeConfig);
    return this.sdk.currentArag.pipe(
      take(1),
      switchMap((arag) => {
        switch (node.nodeCategory) {
          case 'preprocess':
            return arag.patchPreprocess({ id: agentId, ...(agentConfig as PreprocessAgentCreation) });
          case 'context':
            return arag.patchContext({ id: agentId, ...(agentConfig as ContextAgentCreation) });
          case 'generation':
            return arag.patchGeneration({ id: agentId, ...(agentConfig as GenerationAgentCreation) });
          case 'postprocess':
            return arag.patchPostprocess({ id: agentId, ...(agentConfig as PostprocessAgentCreation) });
        }
      }),
    );
  }

  private deleteAgent(deletedNode: { id: string; category: NodeCategory }): Observable<void> {
    return this.sdk.currentArag.pipe(
      take(1),
      switchMap((arag) => {
        switch (deletedNode.category) {
          case 'preprocess':
            return arag.deletePreprocess(deletedNode.id);
          case 'context':
            return arag.deleteContext(deletedNode.id);
          case 'generation':
            return arag.deleteGeneration(deletedNode.id);
          case 'postprocess':
            return arag.deletePostprocess(deletedNode.id);
        }
      }),
    );
  }
}
