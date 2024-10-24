import { Directive, inject } from '@angular/core';
import { filter, map, switchMap, take } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { TasksAutomationService } from '../tasks-automation.service';
import { ApplyOption, TaskStatus } from '@nuclia/core';

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

  taskId = this.activeRoute.params.pipe(
    filter((params) => !!params['taskId']),
    map((params) => params['taskId'] as string),
  );
  task?: TaskWithApplyOption;

  backRoute = this.activeRoute.params.pipe(map((params) => (!params['taskId'] ? '..' : '../..')));

  errorMessages = {
    required: 'validation.required',
  };

  constructor() {
    this.taskId
      .pipe(
        switchMap((taskId) => this.tasksAutomation.getTask(taskId)),
        take(1),
      )
      .subscribe((response) => {
        const applyOption: ApplyOption =
          response.config && response.request ? 'ALL' : response.request ? 'EXISTING' : 'NEW';
        const task = response.config || response.request;
        this.task = task ? { ...task, applyOption } : undefined;
      });
  }

  backToTaskList() {
    this.backRoute
      .pipe(
        take(1),
        switchMap((backRoute) => this.router.navigate([backRoute], { relativeTo: this.activeRoute })),
      )
      .subscribe();
  }
}
