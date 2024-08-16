import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskListItemComponent } from '../task-list-item/task-list-item.component';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TasksAutomationService } from '../tasks-automation.service';
import { Subject } from 'rxjs';
import { InfoCardComponent } from '@nuclia/sistema';

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
  private unsubscribeAll = new Subject<void>();

  textBlocksLabelerTasks = this.taskAutomation.textBlocksLabelerTasks;

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
}
