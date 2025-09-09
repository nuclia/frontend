import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SisToastService, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import {
  PaButtonModule,
  PaDateTimeModule,
  PaDropdownModule,
  PaPopupModule,
  PaTableModule,
} from '@guillotinaweb/pastanaga-angular';
import { combineLatest, map, ReplaySubject, shareReplay } from 'rxjs';
import { TasksAutomationService } from '../../tasks-automation.service';
import { DataAugmentationTaskOnGoing, OneTimeTask } from '../../tasks-automation.models';

@Component({
  selector: 'app-task-execution',
  imports: [
    CommonModule,
    PaButtonModule,
    PaDateTimeModule,
    PaDropdownModule,
    PaPopupModule,
    PaTableModule,
    TwoColumnsConfigurationItemComponent,
    TranslateModule,
  ],
  templateUrl: './task-execution.component.html',
  styleUrl: './task-execution.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskExecutionComponent {
  private toaster = inject(SisToastService);
  private tasksAutomation = inject(TasksAutomationService);

  taskSubject = new ReplaySubject<DataAugmentationTaskOnGoing>(1);

  @Input() set task(value: DataAugmentationTaskOnGoing | undefined) {
    if (value) {
      this._task = value;
      this.taskSubject.next(value);
    }
  }
  get task() {
    return this._task;
  }
  private _task?: DataAugmentationTaskOnGoing;

  batchTasks = combineLatest([this.tasksAutomation.taskList, this.taskSubject]).pipe(
    map(
      ([list, task]) =>
        list
          .filter((item) => item.type === 'one-time' && item.title === task.parameters.name)
          .sort((a, b) => a.creationDate.localeCompare(b.creationDate) * -1) as OneTimeTask[],
    ),
    shareReplay(1),
  );

  runningTask = this.batchTasks.pipe(map((task) => task.some((task) => task.status === 'progress')));

  enable(enabled: boolean) {
    this.tasksAutomation.enableTask(this.task?.id || '', enabled).subscribe();
  }

  runTask() {
    this.tasksAutomation.startBatchTask(this.task?.task.name || 'ask', this.task?.id || '').subscribe({
      error: (error) => {
        this.toaster.error(typeof error?.body?.detail === 'string' ? error?.body?.detail : 'generic.error.oops');
      },
    });
  }

  stopTask(taskId: string) {
    this.tasksAutomation.stopTask(taskId).subscribe();
  }

  restartTask(taskId: string) {
    this.tasksAutomation.restartTask(taskId).subscribe();
  }
}
