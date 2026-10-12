import { booleanAttribute, ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { PaCardModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { TaskName } from '@nuclia/core';
import { BadgeComponent } from '@nuclia/sistema';
import { TASK_CARD_TONES, TASK_ICONS } from '../tasks-automation.models';

@Component({
  selector: 'app-task-card',
  imports: [BadgeComponent, PaCardModule, PaIconModule, TranslatePipe],
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.scss', '../_task.common.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCardComponent {
  icons = TASK_ICONS;
  tones = TASK_CARD_TONES;

  @Input({ required: true }) type: TaskName = 'ask';
  @Input({ transform: booleanAttribute }) ready = false;
  @Output() newTask = new EventEmitter<void>();
}
