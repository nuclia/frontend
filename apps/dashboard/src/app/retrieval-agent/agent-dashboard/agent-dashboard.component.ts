import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { AgentBoxComponent } from './agent-box/agent-box.component';
import { ConnectableEntryComponent } from './connectable-entry/connectable-entry.component';
import { ArrowDownComponent } from './arrow-down.component';

@Component({
  imports: [CommonModule, ArrowDownComponent, PaButtonModule, AgentBoxComponent, ConnectableEntryComponent],
  templateUrl: './agent-dashboard.component.html',
  styleUrl: './agent-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentDashboardComponent {}
