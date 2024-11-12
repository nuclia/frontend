import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskListItemComponent } from '../task-list-item/task-list-item.component';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TasksAutomationService } from '../tasks-automation.service';
import { map, of, Subject, switchMap } from 'rxjs';
import { InfoCardComponent, SisToastService } from '@nuclia/sistema';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, TaskListItemComponent, TranslateModule, InfoCardComponent],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private activeRoute = inject(ActivatedRoute);
  private taskAutomation = inject(TasksAutomationService);
  private toaster = inject(SisToastService);
  private unsubscribeAll = new Subject<void>();

  labelerTasks = this.taskAutomation.taskList.pipe(
    map((taskList) => taskList.filter((task) => task.taskName === 'labeler')),
  );
  askTasks = this.taskAutomation.taskList.pipe(map((taskList) => taskList.filter((task) => task.taskName === 'ask')));
  graphTasks = this.taskAutomation.taskList.pipe(map((taskList) => taskList.filter((task) => task.taskName === 'llm-graph')));

  ngOnInit() {
    this.taskAutomation.initTaskList();
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  createTask(taskPath: string) {
    this.router.navigate([`./${taskPath}`], { relativeTo: this.activeRoute });
  }

  deleteTask(taskId: string) {
    this.taskAutomation
      .getTask(taskId)
      .pipe(
        switchMap((response) => {
          const inProgress =
            response.request && !response.request.completed && !response.request.stopped && !response.request.failed;
          if (inProgress) {
            this.toaster.error('tasks-automation.errors.deleting');
            return of(null);
          } else {
            return this.taskAutomation.deleteTask(taskId);
          }
        }),
      )
      .subscribe();
  }

  stopTask(taskId: string) {
    this.taskAutomation.stopTask(taskId).subscribe();
  }

  restartTask(taskId: string) {
    this.taskAutomation.restartTask(taskId).subscribe();
  }
}
