import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-tasks-automation',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './tasks-automation.component.html',
  styleUrl: './tasks-automation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksAutomationComponent {}
