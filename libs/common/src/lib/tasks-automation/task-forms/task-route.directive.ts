import { Directive, inject } from '@angular/core';
import { filter, map, shareReplay, switchMap, take } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { TasksAutomationService } from '../tasks-automation.service';
import { TaskName, TaskParameters } from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';

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
    map((response) => response.config),
    shareReplay(1),
  );

  saveTask(type: TaskName, parameters: TaskParameters) {
    this.activeRoute.params
      .pipe(
        map((params) => params['taskId']),
        take(1),
        switchMap((taskId) =>
          taskId
            ? this.tasksAutomation.editTask(taskId, parameters).pipe(map(() => taskId))
            : this.tasksAutomation.startTask(type, parameters).pipe(map((res) => res.id)),
        ),
        switchMap((taskId) =>
          this.tasksAutomation.tasksRoute.pipe(
            take(1),
            map((route) => route + `/${taskId}`),
          ),
        ),
      )
      .subscribe({
        next: (taskRoute) => {
          this.router.navigate([taskRoute]);
        },
        error: (error) => this.showError(error),
      });
  }

  backToTaskList() {
    this.tasksAutomation.tasksRoute
      .pipe(
        take(1),
        switchMap((tasksRoute) => this.router.navigate([tasksRoute])),
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
