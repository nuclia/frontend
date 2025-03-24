import { Directive, inject } from '@angular/core';
import { filter, map, shareReplay, switchMap, take } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { TasksAutomationService } from './tasks-automation.service';
import { ApplyOption, DataAugmentationParameters, TaskName, TaskParameters, TaskStatus } from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { NavigationService } from '@flaps/core';

export interface TaskWithApplyOption extends TaskStatus {
  applyOption: ApplyOption;
  parameters: DataAugmentationParameters;
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
  protected navigation = inject(NavigationService);

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

  backRoute = this.navigation.kbUrl.pipe(map((kbUrl) => `${kbUrl}/tasks`));

  saveTask(type: TaskName, parameters: TaskParameters, applyTo: ApplyOption) {
    this.activeRoute.params
      .pipe(
        map((params) => params['taskId']),
        take(1),
        switchMap((taskId) =>
          taskId
            ? this.tasksAutomation.editTask(taskId, parameters).pipe(map(() => taskId))
            : this.tasksAutomation.startTask(type, parameters, applyTo).pipe(map(() => undefined)),
        ),
      )
      .subscribe({
        next: (taskId) => {
          this.router.navigate([taskId ? `../../${taskId}` : `..`], { relativeTo: this.activeRoute });
        },
        error: (error) => this.showError(error),
      });
  }

  backToTaskList() {
    this.backRoute
      .pipe(
        take(1),
        switchMap((backRoute) => this.router.navigate([backRoute])),
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
