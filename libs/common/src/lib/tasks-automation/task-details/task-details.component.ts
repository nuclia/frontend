import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import {
  PaButtonModule,
  PaDropdownModule,
  PaIconModule,
  PaPopupModule,
  PaTabsModule,
} from '@guillotinaweb/pastanaga-angular';
import { SisModalService, StickyFooterComponent } from '@nuclia/sistema';
import { TaskSettingsComponent } from './task-settings/task-settings.component';
import { TaskTestingComponent } from './task-testing/task-testing.component';
import { TaskName } from '@nuclia/core';
import { combineLatest, filter, map, of, switchMap, take } from 'rxjs';
import { TasksAutomationService } from '../tasks-automation.service';
import { TaskExecutionComponent } from './task-execution/task-execution.component';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TASK_ICONS } from '../tasks-automation.models';

@Component({
  imports: [
    CommonModule,
    PaButtonModule,
    TranslateModule,
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

  cleanTask(taskId: string, name: string) {
    this.taskAutomation.cleanOnGoingTask(taskId, name).subscribe();
  }

  deleteTask(taskId: string, name: string, deleteData: boolean) {
    this.taskAutomation
      .deleteOnGoingTask(taskId, name, deleteData)
      .pipe(
        switchMap(() => this.tasksRoute),
        take(1),
      )
      .subscribe((route) => {
        this.router.navigate([route]);
      });
  }
}
