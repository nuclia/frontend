import {
  AfterContentInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { AgentBoxComponent, ConnectableEntryComponent } from './workflow/basic-elements';
import { ArrowDownComponent } from './arrow-down.component';
import { LinkService, WorkflowService } from './workflow';
import { ConditionalNodeComponent } from './workflow/conditional-node/conditional-node.component';

@Component({
  imports: [
    CommonModule,
    ArrowDownComponent,
    PaButtonModule,
    AgentBoxComponent,
    ConnectableEntryComponent,
    ConditionalNodeComponent,
  ],
  templateUrl: './agent-dashboard.component.html',
  styleUrl: './agent-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentDashboardComponent implements AfterViewInit {
  private linkService = inject(LinkService);
  private workflowService = inject(WorkflowService);

  @ViewChild('linkContainer') linkContainer?: ElementRef;

  ngAfterViewInit(): void {
    if (this.linkContainer) {
      this.linkService.container = this.linkContainer;
    }
  }
}
