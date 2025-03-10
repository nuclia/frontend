import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TasksAutomationService } from '../tasks-automation.service';
import { BehaviorSubject, combineLatest, filter, map, of, switchMap } from 'rxjs';
import { BadgeComponent, SisModalService, SisToastService } from '@nuclia/sistema';
import { FeaturesService } from '@flaps/core';
import {
  PaButtonModule,
  PaCardModule,
  PaDateTimeModule,
  PaDropdownModule,
  PaIconModule,
  PaPopupModule,
  PaTableModule,
} from '@guillotinaweb/pastanaga-angular';
import { TaskCardComponent } from './task-card.component';
import { TASK_ICONS } from '../tasks-automation.models';

@Component({
  selector: 'app-task-list',
  imports: [
    BadgeComponent,
    CommonModule,
    PaButtonModule,
    PaCardModule,
    PaDateTimeModule,
    PaDropdownModule,
    PaIconModule,
    PaPopupModule,
    PaTableModule,
    RouterModule,
    TaskCardComponent,
    TranslateModule,
  ],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListComponent implements OnInit {
  private router = inject(Router);
  private activeRoute = inject(ActivatedRoute);
  private taskAutomation = inject(TasksAutomationService);
  private toaster = inject(SisToastService);
  private modalService = inject(SisModalService);
  private features = inject(FeaturesService);

  icons = TASK_ICONS;
  isDescending = new BehaviorSubject<boolean>(true);
  taskList = combineLatest([this.taskAutomation.taskList, this.isDescending]).pipe(
    map(([taskList, isDescending]) =>
      taskList.sort((a, b) => a.creationDate.localeCompare(b.creationDate) * (isDescending ? -1 : 1)),
    ),
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

  createTask(taskPath: string) {
    this.router.navigate([`./${taskPath}`], { relativeTo: this.activeRoute });
  }

  toggleOrder() {
    this.isDescending.next(!this.isDescending.value);
  }

  deleteTask(taskId: string, deleteData: boolean) {
    this.modalService
      .openConfirm({
        title: `tasks-automation.actions.${deleteData ? 'delete-all' : 'delete-agent'}.title`,
        description: `tasks-automation.actions.${deleteData ? 'delete-all' : 'delete-agent'}.description`,
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
        switchMap(() => this._stopTask(taskId)),
        switchMap(() => this.taskAutomation.deleteTask(taskId, deleteData)),
      )
      .subscribe(() => {
        this.toaster.success(`tasks-automation.actions.${deleteData ? 'delete-all' : 'delete-agent'}.success`);
      });
  }

  stopTask(taskId: string) {
    this._stopTask(taskId).subscribe();
  }

  restartTask(taskId: string) {
    this.taskAutomation.restartTask(taskId).subscribe();
  }

  cleanTask(taskId: string) {
    this.modalService
      .openConfirm({
        title: 'tasks-automation.actions.delete-data.title',
        description: 'tasks-automation.actions.delete-data.description',
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
        switchMap(() => this._stopTask(taskId)),
        switchMap(() => this.taskAutomation.cleanTask(taskId)),
      )
      .subscribe(() => {
        this.toaster.success('tasks-automation.actions.delete-data.success');
      });
  }

  private _stopTask(taskId: string) {
    return this.taskAutomation.getTask(taskId).pipe(
      switchMap((response) => {
        const inProgress =
          response.request && !response.request.completed && !response.request.stopped && !response.request.failed;
        return inProgress ? this.taskAutomation.stopTask(taskId) : of(undefined);
      }),
    );
  }
}
