import { booleanAttribute, ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaButtonModule, PaDateTimeModule, PaTableModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { BadgeComponent } from '@nuclia/sistema';

interface BaseTask {
  count: { total: number; processed: number };
  creationDate: string;
  filters: { label: string; count?: number }[];
  hasPrompt?: boolean;
  type: 'automated' | 'one-time';
  fieldName?: string;
  labelSet?: string;
  nerFamily?: string;
}

interface AutomatedTask extends BaseTask {
  running: boolean;
  type: 'automated';
}

interface OneTimeTask extends BaseTask {
  status: 'completed' | 'progress' | 'error';
  type: 'one-time';
}

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
  @Input() taskList: (AutomatedTask | OneTimeTask)[] = [
    {
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
      count: { total: 85, processed: 85 },
      creationDate: new Date().toISOString(),
      filters: [{ label: 'labels', count: 120 }],
      running: true,
      type: 'automated',
      fieldName: 'summary_contracts',
    },
    {
      count: { total: 12, processed: 12 },
      creationDate: new Date().toISOString(),
      filters: [],
      hasPrompt: true,
      running: false,
      type: 'automated',
      fieldName: 'summary_test',
    },
    {
      count: { total: 128, processed: 1 },
      creationDate: new Date().toISOString(),
      filters: [],
      status: 'progress',
      type: 'one-time',
    },
    {
      count: { total: 12, processed: 12 },
      creationDate: new Date().toISOString(),
      filters: [],
      status: 'completed',
      type: 'one-time',
    },
    {
      count: { total: 128, processed: 1 },
      creationDate: new Date().toISOString(),
      filters: [],
      status: 'error',
      type: 'one-time',
    },
  ];
  @Input({ transform: booleanAttribute }) hasArchive = false;

  @Output() newTask = new EventEmitter<void>();
  @Output() seeArchive = new EventEmitter<void>();

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
