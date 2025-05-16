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
  AskAgentUI,
  BaseConditionalAgentUI,
  getAgentFromConfig,
  isCondionalNode,
  NodeCategory,
  ParentNode,
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
    if (!nodeInitialisationDone()) {
      return;
    }
    const workflowState = workflow();

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
      forkJoin(requests.map((item) => item.request)).subscribe();
    }

    // Check if there is a node to be deleted from the backend
    if (workflowState.deletedAgent) {
      this.deleteAgent(workflowState.deletedAgent);
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
    const fallbackEntry = node.nodeRef.instance.boxComponent.connectableEntries?.find(
      (entry) => entry.id() === 'fallback',
    );
    if (fallbackEntry) {
      fallbackEntry.disabledState.set(!!node.fallback);
    }

    return fullyConfigured;
  }

  private isFullyConfigured(node: ParentNode): boolean {
    if (!node.nodeConfig) {
      return false;
    } else if (isCondionalNode(node.nodeType)) {
      const config = node.nodeConfig as BaseConditionalAgentUI;
      if (!config.then || config.then.length < 1) {
        return false;
      }
    }
    return true;
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
        if (parentNode) {
          if (agentId) {
            const request = this.updateAgent(parentNode, agentId).pipe(
              tap(() => {
                const partialNode = { isSaved: true };
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
  ): { parentNode: ParentNode; children: { id: string; childIndex: number }[] } | undefined {
    if (!childNode.parentId) {
      return;
    }
    const parentNode = getNode(childNode.parentId, childNode.nodeCategory);
    let updatedChildren: { id: string; childIndex: number }[] = [];
    if (!parentNode || !parentNode.nodeConfig) {
      return;
    }
    const childId = childNode.nodeRef.instance.id;
    if (parentNode.fallback === childId) {
      (parentNode.nodeConfig as AskAgentUI).fallback = getAgentFromConfig(
        childNode.nodeType,
        childNode.nodeConfig,
      ) as BaseContextAgent;
    } else if (parentNode.then || parentNode.else) {
      if ((parentNode.then || []).includes(childId)) {
        updatedChildren.push(this.updateConditionalChildrenConfig(parentNode, childNode, 'then'));
      } else if ((parentNode.else || []).includes(childId)) {
        updatedChildren.push(this.updateConditionalChildrenConfig(parentNode, childNode, 'else_'));
      }
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
  private updateConditionalChildrenConfig(
    parentNode: ParentNode,
    childNode: ParentNode,
    property: 'then' | 'else_',
  ): { id: string; childIndex: number } {
    const parentConfig = parentNode.nodeConfig as BaseConditionalAgentUI;
    const children = parentConfig[property] || [];
    const childConfig = getAgentFromConfig(childNode.nodeType, childNode.nodeConfig);
    let updatedChild;
    if (typeof childNode.childIndex === 'number') {
      children[childNode.childIndex] = childConfig;
      updatedChild = { id: childNode.nodeRef.instance.id, childIndex: childNode.childIndex };
    } else {
      children.push(childConfig);
      const childIndex = children.length - 1;
      updatedChild = { id: childNode.nodeRef.instance.id, childIndex };
    }
    parentConfig[property] = children;
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

  private deleteAgent(deletedNode: { id: string; category: NodeCategory }): void {
    this.sdk.currentArag
      .pipe(
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
      )
      .subscribe({
        next: () => resetDeletedNode(),
        error: () => this.toaster.error(this.translate.instant('retrieval-agents.workflow.errors.delete-agent')),
      });
  }
}
