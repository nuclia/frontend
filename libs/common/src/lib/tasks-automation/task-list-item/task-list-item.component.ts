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
    // FIXME: cleanup
    this._taskList = [
      {
        id: 'id1',
        taskName: 'text-blocs-labeler',
        count: { total: 258, processed: 258 },
        creationDate: new Date().toISOString(),
        filters: [
          { label: 'file type', count: 1 },
          { label: 'language', count: 1 },
        ],
        running: true,
        type: 'automated',
        fieldName: 'summary_pdf',
      },
      {
        id: 'id2',
        taskName: 'text-blocs-labeler',
        count: { total: 85, processed: 85 },
        creationDate: new Date().toISOString(),
        filters: [{ label: 'labels', count: 120 }],
        running: true,
        type: 'automated',
        fieldName: 'summary_contracts',
      },
      {
        id: 'id3',
        taskName: 'text-blocs-labeler',
        count: { total: 12, processed: 12 },
        creationDate: new Date().toISOString(),
        filters: [],
        hasPrompt: true,
        running: false,
        type: 'automated',
        fieldName: 'summary_test',
      },
      {
        id: 'id4',
        taskName: 'text-blocs-labeler',
        count: { total: 128, processed: 1 },
        creationDate: new Date().toISOString(),
        filters: [],
        status: 'progress',
        type: 'one-time',
      },
      {
        id: 'id5',
        taskName: 'text-blocs-labeler',
        count: { total: 12, processed: 12 },
        creationDate: new Date().toISOString(),
        filters: [],
        status: 'completed',
        type: 'one-time',
      },
      {
        id: 'id6',
        taskName: 'text-blocs-labeler',
        count: { total: 128, processed: 1 },
        creationDate: new Date().toISOString(),
        filters: [],
        status: 'error',
        type: 'one-time',
      },
    ];
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

  private _taskList: (AutomatedTask | OneTimeTask)[] = [];

  get firstColumn(): { field: 'fieldName' | 'labelSet' | 'nerFamily'; header: string } {
    switch (this.taskType) {
      case 'summarize':
      case 'global-question':
      case 'question-answer':
        return { field: 'fieldName', header: 'tasks-automation.table.header.field-name' };
      case 'label-resources':
      case 'label-text-blocks':
        return { field: 'labelSet', header: 'tasks-automation.table.header.label-set' };
      case 'label-ners':
        return { field: 'nerFamily', header: 'tasks-automation.table.header.ner-family' };
    }
  }
}
