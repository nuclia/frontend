import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskListItemComponent } from '../task-list-item/task-list-item.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TasksAutomationService } from '../tasks-automation.service';
import { BaseTask } from '../tasks-automation.models';
import { filter, map, of, Subject, switchMap } from 'rxjs';
import { BadgeComponent, InfoCardComponent, SisModalService, SisToastService } from '@nuclia/sistema';
import { FeaturesService } from '@flaps/core';

@Component({
  selector: 'app-task-list',
  imports: [BadgeComponent, CommonModule, TaskListItemComponent, TranslateModule, InfoCardComponent],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private activeRoute = inject(ActivatedRoute);
  private taskAutomation = inject(TasksAutomationService);
  private toaster = inject(SisToastService);
  private features = inject(FeaturesService);
  private modalService = inject(SisModalService);
  private translate = inject(TranslateService);
  private unsubscribeAll = new Subject<void>();

  labelerTasks = this.taskAutomation.taskList.pipe(
    map((taskList) => taskList.filter((task) => task.taskName === 'labeler')),
  );
  askTasks = this.taskAutomation.taskList.pipe(map((taskList) => taskList.filter((task) => task.taskName === 'ask')));
  graphTasks = this.taskAutomation.taskList.pipe(
    map((taskList) => taskList.filter((task) => task.taskName === 'llm-graph')),
  );
  questionAnswerTasks = this.taskAutomation.taskList.pipe(
    map((taskList) => taskList.filter((task) => task.taskName === 'synthetic-questions')),
  );
  contentSafetyTasks = this.taskAutomation.taskList.pipe(
    map((taskList) => taskList.filter((task) => task.taskName === 'llama-guard')),
  );
  llmSecurityTasks = this.taskAutomation.taskList.pipe(
    map((taskList) => taskList.filter((task) => task.taskName === 'prompt-guard')),
  );
  labelerTaskEnabled = this.features.authorized.labelerTask;
  askTaskEnabled = this.features.authorized.askTask;
  graphTaskEnabled = this.features.unstable.graphTask;
  questionsTaskEnabled = this.features.unstable.questionsTask;
  promptSafetyTaskEnabled = this.features.unstable.promptSafetyTask;
  contentSafetyTaskEnabled = this.features.unstable.contentSafetyTask;

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

  cleanTask(task: BaseTask) {
    this.modalService
      .openConfirm({
        title: this.translate.instant('tasks-automation.confirm-clean.title', { agent: task.title }),
        description: 'tasks-automation.confirm-clean.description',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
        switchMap(() => this.taskAutomation.cleanTask(task.id)),
      )
      .subscribe();
  }
}
