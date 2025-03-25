import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule, PaTabsModule } from '@guillotinaweb/pastanaga-angular';
import { BackButtonComponent, SisModalService } from '@nuclia/sistema';
import { TaskRouteDirective } from '../task-route.directive';
import { TaskSettingsComponent } from '../task-forms/task-settings/task-settings.component';
import { TaskTestingComponent } from './task-testing/task-testing.component';
import { TaskName } from '@nuclia/core';
import { filter, of, switchMap, take } from 'rxjs';
import { TasksAutomationService } from '../tasks-automation.service';

@Component({
  imports: [
    CommonModule,
    PaButtonModule,
    TranslateModule,
    PaTabsModule,
    BackButtonComponent,
    TaskSettingsComponent,
    TaskTestingComponent,
  ],
  templateUrl: './task-details.component.html',
  styleUrls: ['./task-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailsComponent extends TaskRouteDirective {
  taskAutomotion = inject(TasksAutomationService);
  modalService = inject(SisModalService);

  selectedTab: 'configuration' | 'testing' = 'configuration';
  tasksSupportingTesting: TaskName[] = ['ask', 'labeler', 'llm-graph'];

  modifyTask() {
    this.taskId
      .pipe(
        take(1),
        switchMap((taskId) => this.tasksAutomation.getTask(taskId)),
        switchMap((task) =>
          task.request && !task.request.completed && !task.request.failed && !task.request.stopped
            ? this.modalService
                .openConfirm({
                  title: 'tasks-automation.actions.edit.title',
                  description: 'tasks-automation.actions.edit.description',
                  confirmLabel: 'generic.continue',
                })
                .onClose.pipe(
                  filter((confirm) => confirm),
                  switchMap(() => this.taskAutomotion.stopTask(task.request.id)),
                )
            : of(undefined),
        ),
        switchMap(() => this.task.pipe(take(1))),
      )
      .subscribe((task) => {
        this.router.navigate([`../${task?.task.name}/${task?.id}`], { relativeTo: this.activeRoute });
      });
  }
}
