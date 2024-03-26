import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TaskListItemComponent } from './task-list-item/task-list-item.component';

@Component({
  selector: 'app-tasks-automation',
  standalone: true,
  imports: [CommonModule, TranslateModule, TaskListItemComponent],
  templateUrl: './tasks-automation.component.html',
  styleUrl: './tasks-automation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksAutomationComponent {}
