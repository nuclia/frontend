import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  PaButtonModule,
  PaDropdownModule,
  PaIconModule,
  PaPopupModule,
  PaTabsModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { TaskName } from '@nuclia/core';
import { SisModalService, StickyFooterComponent } from '@nuclia/sistema';
import { combineLatest, filter, map, switchMap, take } from 'rxjs';
import { TASK_ICONS } from '../tasks-automation.models';
import { TasksAutomationService } from '../tasks-automation.service';
import { TaskExecutionComponent } from './task-execution/task-execution.component';
import { TaskSettingsComponent } from './task-settings/task-settings.component';
import { TaskTestingComponent } from './task-testing/task-testing.component';

@Component({
  imports: [
    CommonModule,
    PaButtonModule,
    TranslatePipe,
    PaIconModule,
    PaPopupModule,
    PaDropdownModule,
    PaTabsModule,
    RouterModule,
    StickyFooterComponent,
    TaskExecutionComponent,
    TaskSettingsComponent,
    TaskTestingComponent,
  ],
  templateUrl: './task-details.component.html',
  styleUrls: ['./task-details.component.scss', '../_task.common.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailsComponent {
  taskAutomation = inject(TasksAutomationService);
  modalService = inject(SisModalService);
  router = inject(Router);
  activeRoute = inject(ActivatedRoute);

  selectedTab: 'configuration' | 'testing' | 'execution' = 'configuration';
  tasksSupportingTesting: TaskName[] = ['ask', 'labeler', 'llm-graph'];
  icons = TASK_ICONS;

  taskId = this.activeRoute.params.pipe(
    filter((params) => !!params['taskId']),
    map((params) => params['taskId'] as string),
  );
  task = combineLatest([this.taskId, this.taskAutomation.configs]).pipe(
    map(([taskId, configs]) => configs.find((config) => config.id === taskId)),
  );
  testingTabSupported = this.task.pipe(map((task) => this.tasksSupportingTesting.includes(task?.task.name || 'ask')));
  tasksRoute = this.taskAutomation.tasksRoute;

  modifyTask() {
    this.taskId
      .pipe(
        take(1),
        switchMap((taskId) => this.taskAutomation.goToEditTask(taskId)),
      )
      .subscribe();
  }

  cleanTask(taskId: string) {
    this.taskAutomation.cleanOnGoingTask(taskId).subscribe();
  }

  deleteTask(taskId: string, deleteData: boolean) {
    this.taskAutomation
      .deleteOnGoingTask(taskId, deleteData)
      .pipe(
        switchMap(() => this.tasksRoute),
        take(1),
      )
      .subscribe((route) => {
        this.router.navigate([route]);
      });
  }
}
