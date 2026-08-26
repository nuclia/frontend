import { inject, Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { shareReplay, startWith, Subject, switchMap, take, tap } from 'rxjs';
import { Workflow } from '@nuclia/core';
import { LOCAL_STORAGE } from '@ng-web-apis/common';

const LAST_WORKFLOW_KEY_PREFIX = 'NUCLIA_ARAG_LAST_WORKFLOW';

@Injectable({
  providedIn: 'root',
})
export class WorkflowsService {
  private sdk = inject(SDKService);
  private localStorage = inject(LOCAL_STORAGE);

  private triggerUpdate = new Subject<void>();

  workflows = this.triggerUpdate.pipe(
    startWith(true),
    switchMap(() => this.sdk.currentArag),
    switchMap((arag) => arag.getWorkflows()),
    shareReplay(1),
  );

  update() {
    this.triggerUpdate.next();
  }

  /** Remembers the last workflow the user opened for a given agent, so the next visit can resume there. */
  setLastWorkflowId(agentSlug: string, workflowId: string) {
    this.localStorage.setItem(`${LAST_WORKFLOW_KEY_PREFIX}_${agentSlug}`, workflowId);
  }

  getLastWorkflowId(agentSlug: string): string | null {
    return this.localStorage.getItem(`${LAST_WORKFLOW_KEY_PREFIX}_${agentSlug}`);
  }

  createWorkflow(workflow: Workflow) {
    return this.sdk.currentArag.pipe(
      take(1),
      switchMap((arag) => arag.createWorkflow(workflow)),
      tap(() => this.update()),
    );
  }

  patchWorkflow(workflow: Workflow) {
    return this.sdk.currentArag.pipe(
      take(1),
      switchMap((arag) => {
        const { id, ...data } = workflow;
        return arag.patchWorkflow(id, data);
      }),
      tap(() => this.update()),
    );
  }

  deleteWorkflow(workflowId: string) {
    return this.sdk.currentArag.pipe(
      take(1),
      switchMap((arag) => arag.deleteWorkflow(workflowId)),
      tap(() => this.update()),
    );
  }
}
