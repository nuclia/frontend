import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';

@Component({
  imports: [CommonModule, PaButtonModule],
  templateUrl: './agent-dashboard.component.html',
  styleUrl: './agent-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentDashboardComponent {}
