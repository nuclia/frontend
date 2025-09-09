import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TasksAutomationService } from '../tasks-automation.service';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
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
  styleUrls: ['./task-list.component.scss', '../_task.common.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListComponent {
  private router = inject(Router);
  private activeRoute = inject(ActivatedRoute);
  private taskAutomation = inject(TasksAutomationService);
  private features = inject(FeaturesService);

  icons = TASK_ICONS;
  isDescending = new BehaviorSubject<boolean>(true);
  taskList = combineLatest([this.taskAutomation.taskList, this.isDescending]).pipe(
    map(([taskList, isDescending]) =>
      taskList
        .filter((task) => task.type === 'automated')
        .sort((a, b) => a.creationDate.localeCompare(b.creationDate) * (isDescending ? -1 : 1)),
    ),
  );

  labelerTaskEnabled = this.features.authorized.labelerTask;
  askTaskEnabled = this.features.authorized.askTask;
  graphTaskEnabled = this.features.unstable.graphTask;
  questionsTaskEnabled = this.features.unstable.questionsTask;
  promptSafetyTaskEnabled = this.features.unstable.promptSafetyTask;
  contentSafetyTaskEnabled = this.features.unstable.contentSafetyTask;

  createTask(taskPath: string) {
    this.router.navigate([`./${taskPath}`], { relativeTo: this.activeRoute });
  }

  toggleOrder() {
    this.isDescending.next(!this.isDescending.value);
  }

  cleanTask(taskId: string) {
    this.taskAutomation.cleanOnGoingTask(taskId).subscribe();
  }

  deleteTask(taskId: string, deleteData: boolean) {
    this.taskAutomation.deleteOnGoingTask(taskId, deleteData).subscribe();
  }

  editTask(taskId: string) {
    this.taskAutomation.goToEditTask(taskId).subscribe();
  }

  duplicateTask(taskId: string) {
    this.taskAutomation.duplicateTask(taskId).subscribe();
  }
}
