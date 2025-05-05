import { effect, inject, Injectable } from '@angular/core';
import { deepEqual, SDKService } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';
import {
  ContextAgent,
  ContextAgentCreation,
  PostprocessAgent,
  PostprocessAgentCreation,
  PreprocessAgent,
  PreprocessAgentCreation,
} from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { switchMap, take } from 'rxjs';
import { getAgentFromConfig, NodeCategory, ParentNode } from './workflow.models';
import { BackendState, getBackendState, nodeInitialisationDone, workflow, WorkflowState } from './workflow.state';

@Injectable({
  providedIn: 'root',
})
export class WorkflowEffectService {
  private sdk = inject(SDKService);
  private toaster = inject(SisToastService);
  private translate = inject(TranslateService);

  constructor() {
    effect(() => {
      if (!nodeInitialisationDone()) {
        return;
      }
      const backendState = getBackendState();
      const workflowState = workflow();

      // Check if there are changes to be saved in the workflow
      Object.values(workflowState.preprocess).forEach((node) => this.checkForUpdates(node, backendState, 'preprocess'));
      Object.values(workflowState.context).forEach((node) => this.checkForUpdates(node, backendState, 'context'));
      Object.values(workflowState.postprocess).forEach((node) =>
        this.checkForUpdates(node, backendState, 'postprocess'),
      );

      // Check if there are nodes to be deleted from the backend
      Object.values(backendState.preprocess).forEach((agent) =>
        this.checkForDeletion(agent.id, workflowState, 'preprocess'),
      );
      Object.values(backendState.context).forEach((agent) => this.checkForDeletion(agent.id, workflowState, 'context'));
      Object.values(backendState.postprocess).forEach((agent) =>
        this.checkForDeletion(agent.id, workflowState, 'postprocess'),
      );
    });
  }

  checkForDeletion(agentId: string, workflowState: WorkflowState, category: NodeCategory): void {
    const node = Object.values(workflowState[category]).find((node) => node.agent?.id === agentId);
    if (!node) {
      this.sdk.currentArag
        .pipe(
          take(1),
          switchMap((arag) => {
            switch (category) {
              case 'preprocess':
                return arag.deletePreprocess(agentId);
              case 'context':
                return arag.deleteContext(agentId);
              case 'postprocess':
                return arag.deletePostprocess(agentId);
            }
          }),
        )
        .subscribe({
          error: () => this.toaster.error(this.translate.instant('retrieval-agents.workflow.errors.delete-agent')),
        });
    }
  }

  checkForUpdates(node: ParentNode, backendState: BackendState, category: NodeCategory) {
    if (!node.nodeConfig) {
      // Node is not ready to be saved
      return;
    }
    const uiAgent = getAgentFromConfig(node.nodeType, node.nodeConfig);
    const agentId = node.agent?.id;
    if (!agentId) {
      // TODO check if agent is fully configured before saving it
      this.addAgent(uiAgent, category);
    } else {
      const agent = backendState[category].find((agent) => agent.id === agentId);
      if (!agent) {
        console.error('Backend state:', backendState);
        console.error('UI node:', node);
        throw new Error(`Agent id ${agentId} not found in backend state`);
      }
      // Remove models and title from the comparison as they are set on the backend and not on the front
      const { id, title, model, validate_model, summarize_model, ...backAgent } = agent;
      if (!deepEqual(uiAgent, backAgent)) {
        this.updateAgent(agent, uiAgent, category);
      }
    }
  }

  addAgent(
    creationData: PreprocessAgentCreation | ContextAgentCreation | PostprocessAgentCreation,
    category: NodeCategory,
  ) {
    this.sdk.currentArag
      .pipe(
        take(1),
        switchMap((arag) => {
          switch (category) {
            case 'preprocess':
              return arag.addPreprocess(creationData as PreprocessAgentCreation);
            case 'context':
              return arag.addContext(creationData as ContextAgentCreation);
            case 'postprocess':
              return arag.addPostprocess(creationData as PostprocessAgentCreation);
          }
        }),
      )
      .subscribe({
        error: () => this.toaster.error(this.translate.instant('retrieval-agents.workflow.errors.save-agent')),
      });
  }

  updateAgent(
    agent: PreprocessAgent | ContextAgent | PostprocessAgent,
    newConfig: PreprocessAgentCreation | ContextAgentCreation | PostprocessAgentCreation,
    category: NodeCategory,
  ) {
    this.sdk.currentArag
      .pipe(
        take(1),
        switchMap((arag) => {
          switch (category) {
            case 'preprocess':
              return arag.patchPreprocess({ ...agent, ...(newConfig as PreprocessAgentCreation) });
            case 'context':
              return arag.patchContext({ ...agent, ...(newConfig as ContextAgentCreation) });
            case 'postprocess':
              return arag.patchPostprocess({ ...agent, ...(newConfig as PostprocessAgentCreation) });
          }
        }),
      )
      .subscribe({
        error: () => this.toaster.error(this.translate.instant('retrieval-agents.workflow.errors.save-agent')),
      });
  }
}
