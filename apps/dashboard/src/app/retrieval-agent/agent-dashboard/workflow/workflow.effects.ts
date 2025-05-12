import { inject, Injectable } from '@angular/core';
import { deepEqual, SDKService } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';
import {
  AskAgent,
  AskAgentCreation,
  BaseAgent,
  ConditionalAgent,
  ConditionalAgentCreation,
  ContextAgent,
  ContextAgentCreation,
  PostprocessAgent,
  PostprocessAgentCreation,
  PreprocessAgent,
  PreprocessAgentCreation,
} from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { map, switchMap, take, tap } from 'rxjs';
import { getAgentFromConfig, NodeCategory, ParentNode } from './workflow.models';
import {
  BackendState,
  getBackendState,
  getNode,
  nodeInitialisationDone,
  selectedNodeId,
  updateBackendState,
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
    if (!nodeInitialisationDone()) {
      return;
    }
    const backendState = getBackendState();
    const workflowState = workflow();

    console.debug('Effect:');
    console.debug('    backendState', { ...backendState });
    console.debug('    workflowState', { ...workflowState });

    // Check if there are changes to be saved in the workflow
    Object.values(workflowState.preprocess).forEach((node) => {
      this.checkNodeState(node);
      this.checkForUpdates(node, backendState, 'preprocess');
    });
    Object.values(workflowState.context).forEach((node) => {
      this.checkNodeState(node);
      this.checkForUpdates(node, backendState, 'context');
    });
    Object.values(workflowState.postprocess).forEach((node) => {
      this.checkNodeState(node);
      this.checkForUpdates(node, backendState, 'postprocess');
    });
    Object.values(workflowState.children).forEach((node) => this.checkNodeState(node));

    // Check if there are nodes to be deleted from the backend
    Object.values(backendState.preprocess).forEach((agent) =>
      this.checkForDeletion(agent.id, workflowState, 'preprocess'),
    );
    Object.values(backendState.context).forEach((agent) => this.checkForDeletion(agent.id, workflowState, 'context'));
    Object.values(backendState.postprocess).forEach((agent) =>
      this.checkForDeletion(agent.id, workflowState, 'postprocess'),
    );
  }

  private checkNodeState(node: ParentNode) {
    if (!node.nodeConfig) {
      const selectedNode = selectedNodeId();
      if (selectedNode !== node.nodeRef.instance.id) {
        node.nodeRef.setInput('state', 'unsaved');
      }
    }
  }

  private checkForUpdates(node: ParentNode, backendState: BackendState, category: NodeCategory) {
    if (!node.nodeConfig) {
      // Node is not ready to be saved
      return;
    }
    const uiAgent = getAgentFromConfig(node.nodeType, node.nodeConfig);
    const agentId = node.agent?.id;
    if (!agentId) {
      console.log(` - Add agent`, node);
      this.addAgent(uiAgent, category, node.nodeRef.instance.id);
    } else {
      const agent = backendState[category].find((agent) => agent.id === agentId);
      if (!agent) {
        console.debug(' - Check for updates: UI node', node);
        console.error(`Agent id ${agentId} not found in backend state`);
        return;
      }

      // Manage node potential children cases first
      if (node.fallback) {
        // TODO: save children of children?
        const child = getNode(node.fallback, category);
        if (!child?.nodeConfig) {
          return;
        } else {
          const askAgent = agent as AskAgent;
          const childAgent = getAgentFromConfig(child.nodeType, child.nodeConfig);
          if (!askAgent.fallback || !deepEqual(childAgent, askAgent.fallback, true)) {
            (uiAgent as AskAgentCreation).fallback = childAgent as ContextAgent;
            console.debug(` -> Update ask agent with fallback ${node.fallback}`, uiAgent);
            this.updateAgent(agent, uiAgent, category);
          }
        }
      } else if (node.then || node.else) {
        const conditionalAgent = agent as ConditionalAgent;
        const thenAgents: BaseAgent[] = this.getChildAgents(node, 'then', category);
        const elseAgents: BaseAgent[] = this.getChildAgents(node, 'else', category);
        let shouldUpdate = false;
        if (thenAgents.length > 0 && !deepEqual(thenAgents, conditionalAgent.then, true)) {
          (uiAgent as ConditionalAgentCreation).then = thenAgents;
          console.debug(` -> Update node with then`, thenAgents);
          shouldUpdate = true;
        }
        if (elseAgents.length > 0 && !deepEqual(elseAgents, conditionalAgent.else_, true)) {
          (uiAgent as ConditionalAgentCreation).else_ = elseAgents;
          console.debug(` -> Update node with else`, elseAgents);
          shouldUpdate = true;
        }
        if (shouldUpdate) {
          this.updateAgent(agent, uiAgent, category);
        }
      } else {
        // If no children, we simply check for deep equality
        if (!deepEqual(uiAgent, agent, true)) {
          console.debug(` - Update agent`, node, uiAgent, agent);
          this.updateAgent(agent, uiAgent, category);
        }
      }
    }
  }

  private getChildAgents(node: ParentNode, property: 'then' | 'else', category: NodeCategory): BaseAgent[] {
    if (!node[property]) {
      return [];
    }
    const children: ParentNode[] = node[property]
      .map((nodeId) => getNode(nodeId, category))
      .filter((node) => !!node?.nodeConfig)
      .map((child) => child as ParentNode);
    return children.map((child) => getAgentFromConfig(child.nodeType, child.nodeConfig) as BaseAgent);
  }

  private addAgent(
    creationData: PreprocessAgentCreation | ContextAgentCreation | PostprocessAgentCreation,
    category: NodeCategory,
    nodeId: string,
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
        switchMap((data) => this.updateBackendState(category).pipe(map(() => data.id))),
      )
      .subscribe({
        next: (id) => {
          updateNode(nodeId, category, { agent: { id, rules: null, ...creationData } });
        },
        error: () => {
          this.toaster.error(this.translate.instant('retrieval-agents.workflow.errors.save-agent'));
        },
      });
  }

  private updateAgent(
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
        switchMap(() => this.updateBackendState(category)),
      )
      .subscribe({
        error: () => this.toaster.error(this.translate.instant('retrieval-agents.workflow.errors.save-agent')),
      });
  }

  private checkForDeletion(agentId: string, workflowState: WorkflowState, category: NodeCategory): void {
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
          switchMap(() => this.updateBackendState(category)),
        )
        .subscribe({
          error: () => this.toaster.error(this.translate.instant('retrieval-agents.workflow.errors.delete-agent')),
        });
    }
  }

  private updateBackendState(category: NodeCategory) {
    console.debug(` => Update backend category ${category}`);
    return this.sdk.currentArag.pipe(
      take(1),
      switchMap((arag) => {
        switch (category) {
          case 'preprocess':
            return arag.getPreprocess();
          case 'context':
            return arag.getContext();
          case 'postprocess':
            return arag.getPostprocess();
        }
      }),
      tap((agents) => updateBackendState({ [category]: agents })),
    );
  }
}
