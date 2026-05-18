import { inject, Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { shareReplay, startWith, Subject, switchMap, take, tap } from 'rxjs';
import { Workflow } from '@nuclia/core';

@Injectable({
  providedIn: 'root',
})
export class WorkflowsService {
  private sdk = inject(SDKService);

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
