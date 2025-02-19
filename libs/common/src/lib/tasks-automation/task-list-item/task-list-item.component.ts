import { booleanAttribute, ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  PaButtonModule,
  PaDateTimeModule,
  PaDropdownModule,
  PaPopupModule,
  PaTableModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { BadgeComponent, InfoCardComponent } from '@nuclia/sistema';
import { AutomatedTask, OneTimeTask } from '../tasks-automation.models';
import { TaskName } from '@nuclia/core';

type TaskWithFilters = (AutomatedTask | OneTimeTask) & { hasFilters: boolean };

@Component({
  selector: 'app-task-list-item',
  imports: [
    CommonModule,
    RouterModule,
    PaButtonModule,
    TranslateModule,
    PaTableModule,
    PaButtonModule,
    PaDateTimeModule,
    BadgeComponent,
    InfoCardComponent,
    PaDropdownModule,
    PaPopupModule,
  ],
  templateUrl: './task-list-item.component.html',
  styleUrl: './task-list-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListItemComponent {
  @Input() taskType: TaskName = 'labeler';
  @Input() taskTitle = '';
  @Input() taskDescription = '';
  @Input()
  set taskList(list: (AutomatedTask | OneTimeTask)[] | null) {
    if (list) {
      this._taskList = list.map((task) => ({
        ...task,
        hasFilters: task.filters.some((filter) => filter.count && filter.count > 0),
      }));
    }
  }
  get taskList(): TaskWithFilters[] {
    return this._taskList;
  }
  @Input({ transform: booleanAttribute }) hasArchive = false;
  /**
   * Temporary input allowing to display or hide the "new" button
   */
  @Input({ transform: booleanAttribute }) readyForBeta = false;

  @Output() newTask = new EventEmitter<void>();
  @Output() seeArchive = new EventEmitter<void>();
  @Output() stop = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();
  @Output() restart = new EventEmitter<string>();

  private _taskList: TaskWithFilters[] = [];

  get firstColumn(): { field: 'fieldName' | 'labelSets' | 'nerFamily'; header: string } {
    switch (this.taskType) {
      case 'labeler':
        return { field: 'labelSets', header: 'tasks-automation.table.header.label-sets' };
      default:
        return { field: 'fieldName', header: 'tasks-automation.table.header.field-name' };
    }
  }
}
