import { booleanAttribute, ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  PaButtonModule,
  PaDateTimeModule,
  PaDropdownModule,
  PaPopupModule,
  PaTableModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { BadgeComponent, InfoCardComponent } from '@nuclia/sistema';
import { AutomatedTask, OneTimeTask } from '../tasks-automation.models';

@Component({
  selector: 'app-task-list-item',
  standalone: true,
  imports: [
    CommonModule,
    PaButtonModule,
    TranslateModule,
    PaTableModule,
    PaButtonModule,
    PaDateTimeModule,
    BadgeComponent,
    PaTogglesModule,
    PaTogglesModule,
    InfoCardComponent,
    PaDropdownModule,
    PaPopupModule,
  ],
  templateUrl: './task-list-item.component.html',
  styleUrl: './task-list-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListItemComponent {
  @Input() taskType:
    | 'summarize'
    | 'global-question'
    | 'question-answer'
    | 'label-resources'
    | 'label-text-blocks'
    | 'label-ners' = 'summarize';
  @Input() taskTitle = '';
  @Input() taskDescription = '';
  @Input()
  set taskList(list: (AutomatedTask | OneTimeTask)[] | null) {
    if (list) {
      this._taskList = list;
    }
  }
  get taskList(): (AutomatedTask | OneTimeTask)[] {
    return this._taskList;
  }
  @Input({ transform: booleanAttribute }) hasArchive = false;
  /**
   * Temporary input allowing to display or hide the "new" button
   */
  @Input({ transform: booleanAttribute }) newTaskFormReady = false;

  @Output() newTask = new EventEmitter<void>();
  @Output() seeArchive = new EventEmitter<void>();
  @Output() stop = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();
  @Output() restart = new EventEmitter<string>();

  private _taskList: (AutomatedTask | OneTimeTask)[] = [];

  get firstColumn(): { field: 'fieldName' | 'labelSets' | 'nerFamily'; header: string } {
    switch (this.taskType) {
      case 'summarize':
      case 'global-question':
      case 'question-answer':
        return { field: 'fieldName', header: 'tasks-automation.table.header.field-name' };
      case 'label-resources':
      case 'label-text-blocks':
        return { field: 'labelSets', header: 'tasks-automation.table.header.label-sets' };
      case 'label-ners':
        return { field: 'nerFamily', header: 'tasks-automation.table.header.ner-family' };
    }
  }

  toggleAction(taskId: string, activate: boolean) {
    if (activate) {
      this.restart.emit(taskId);
    } else {
      this.stop.emit(taskId);
    }
  }
}
