import { Directive, inject } from '@angular/core';
import { filter, map, shareReplay, switchMap, take } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { TasksAutomationService } from '../tasks-automation.service';
import { ApplyOption, TaskStatus } from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';

export interface TaskWithApplyOption extends TaskStatus {
  applyOption: ApplyOption;
}

@Directive({
  selector: '[stfTaskRoute]',
  standalone: true,
})
export class TaskRouteDirective {
  protected activeRoute = inject(ActivatedRoute);
  protected router = inject(Router);
  protected tasksAutomation = inject(TasksAutomationService);
  protected toaster = inject(SisToastService);

  taskId = this.activeRoute.params.pipe(
    filter((params) => !!params['taskId']),
    map((params) => params['taskId'] as string),
  );
  task = this.taskId.pipe(
    switchMap((taskId) => this.tasksAutomation.getTask(taskId)),
    map((response) => {
      const applyOption: ApplyOption =
        response.config && response.request ? 'ALL' : response.request ? 'EXISTING' : 'NEW';
      const task = response.config || response.request;
      return task ? { ...task, applyOption } : undefined;
    }),
    shareReplay(1),
  );

  backRoute = this.activeRoute.params.pipe(map((params) => (!params['taskId'] ? '..' : '../..')));

  errorMessages = {
    required: 'validation.required',
  };

  backToTaskList() {
    this.backRoute
      .pipe(
        take(1),
        switchMap((backRoute) => this.router.navigate([backRoute], { relativeTo: this.activeRoute })),
      )
      .subscribe();
  }

  showError(error: any) {
    const detail = error?.body?.detail;
    if (detail) {
      this.toaster.error(typeof detail === 'string' ? detail : detail?.[0]?.msg);
    }
  }
}
