import { booleanAttribute, ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { BadgeComponent } from '@nuclia/sistema';
import { PaCardModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { TASK_ICONS } from '../tasks-automation.models';
import { TaskName } from '@nuclia/core';

@Component({
  selector: 'app-task-card',
  imports: [BadgeComponent, CommonModule, PaCardModule, PaIconModule, TranslateModule],
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.scss', '../_task.common.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCardComponent {
  icons = TASK_ICONS;

  @Input({ required: true }) type: TaskName = 'ask';
  @Input({ transform: booleanAttribute }) ready: boolean = false;
  @Output() newTask = new EventEmitter<void>();
}
