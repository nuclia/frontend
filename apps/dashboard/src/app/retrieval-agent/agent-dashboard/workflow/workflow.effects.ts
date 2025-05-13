import { inject, Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';
import { ContextAgent, ContextAgentCreation, PostprocessAgentCreation, PreprocessAgentCreation } from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { Observable, switchMap, take } from 'rxjs';
import { AskAgentUI, getAgentFromConfig, NodeCategory, ParentNode } from './workflow.models';
import {
  getNode,
  nodeInitialisationDone,
  resetDeletedNode,
  selectedNodeId,
  updateNode,
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
    console.debug('Effect:');
    if (!nodeInitialisationDone()) {
      console.debug(`    Initialising nodes`);
      return;
    }
    const workflowState = workflow();

    console.debug('    workflowState', { ...workflowState });

    // Check if there are changes to be saved in the workflow
    workflowState.preprocess.forEach((node) => {
      this.checkNodeState(node);
      this.checkForUpdates(node);
    });
    workflowState.context.forEach((node) => {
      this.checkNodeState(node);
      this.checkForUpdates(node);
    });
    workflowState.postprocess.forEach((node) => {
      this.checkNodeState(node);
      this.checkForUpdates(node);
    });
    workflowState.children.forEach((node) => this.checkNodeState(node));
    if (workflowState.children.length > 0) {
      this.checkForChildrenUpdates(workflowState);
    }

    // Check if there is a node to be deleted from the backend
    if (workflowState.deletedAgent) {
      console.debug(` -> Delete agent from backend`, workflowState.deletedAgent);
      this.deleteAgent(workflowState.deletedAgent);
    }
  }

  private checkNodeState(node: ParentNode) {
    if (!node.nodeConfig) {
      const selectedNode = selectedNodeId();
      if (selectedNode !== node.nodeRef.instance.id) {
        node.nodeRef.setInput('state', 'unsaved');
      }
    }

    // Disable fallback entry when a node is already linked to it, enable it otherwise (for the case a child node has been removed)
    const fallbackEntry = node.nodeRef.instance.boxComponent.connectableEntries?.find(
      (entry) => entry.id() === 'fallback',
    );
    if (fallbackEntry) {
      fallbackEntry.disabledState.set(!!node.fallback);
    }
  }

  private checkForUpdates(node: ParentNode) {
    if (!node.nodeConfig) {
      // Node is not ready to be saved
      return;
    }

    const agentId = node.agentId;
    if (!agentId) {
      console.debug(` - Add agent`, node);
      this.addAgent(node);
    } else if (!node.isSaved) {
      console.debug(` - Update agent`, node);
      this.updateAgent(node, agentId).subscribe({
        next: () => updateNode(node.nodeRef.instance.id, node.nodeCategory, { isSaved: true }),
        error: () => this.toaster.error(this.translate.instant('retrieval-agents.workflow.errors.save-agent')),
      });
    }
  }

  private checkForChildrenUpdates(workflowState: WorkflowState) {
    workflowState.children
      .filter((child) => !!child.nodeConfig && !child.isSaved)
      .forEach((node) => {
        const parentNode = this.getFullyConfiguredRootNode(node);
        const agentId = parentNode?.agentId;
        if (parentNode && agentId) {
          console.debug(` -> Update agent with children`, parentNode);
          this.updateAgent(parentNode, agentId).subscribe({
            next: () => updateNode(node.nodeRef.instance.id, node.nodeCategory, { isSaved: true }),
            error: () => this.toaster.error(this.translate.instant('retrieval-agents.workflow.errors.save-agent')),
          });
        }
      });
  }

  private getFullyConfiguredRootNode(childNode: ParentNode): ParentNode | undefined {
    if (childNode.parentId) {
      const parentNode = getNode(childNode.parentId, childNode.nodeCategory);
      if (!parentNode?.nodeConfig) {
        return;
      }
      if (parentNode?.fallback === childNode.nodeRef.instance.id) {
        (parentNode.nodeConfig as AskAgentUI).fallback = getAgentFromConfig(
          childNode.nodeType,
          childNode.nodeConfig,
        ) as ContextAgent;
        if (parentNode.parentId) {
          return this.getFullyConfiguredRootNode(parentNode);
        } else {
          return parentNode;
        }
      } // TODO: manage conditional children case
    }
    return;
  }

  private addAgent(node: ParentNode) {
    const agentCreation = getAgentFromConfig(node.nodeType, node.nodeConfig);
    this.sdk.currentArag
      .pipe(
        take(1),
        switchMap((arag) => {
          switch (node.nodeCategory) {
            case 'preprocess':
              return arag.addPreprocess(agentCreation as PreprocessAgentCreation);
            case 'context':
              return arag.addContext(agentCreation as ContextAgentCreation);
            case 'postprocess':
              return arag.addPostprocess(agentCreation as PostprocessAgentCreation);
          }
        }),
      )
      .subscribe({
        next: ({ id }) => {
          updateNode(node.nodeRef.instance.id, node.nodeCategory, { agentId: id, isSaved: true });
        },
        error: () => {
          this.toaster.error(this.translate.instant('retrieval-agents.workflow.errors.save-agent'));
        },
      });
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
