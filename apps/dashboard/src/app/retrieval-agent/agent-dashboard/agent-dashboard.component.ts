import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { LinkService, WorkflowService } from './workflow';
import { AgentConnectorComponent } from './workflow/agent-connector/agent-connector.component';
import { ConnectableEntryComponent } from './workflow/basic-elements';

@Component({
  imports: [CommonModule, TranslateModule, PaButtonModule, AgentConnectorComponent],
  templateUrl: './agent-dashboard.component.html',
  styleUrl: './agent-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AgentDashboardComponent implements AfterViewInit {
  private linkService = inject(LinkService);
  private workflowService = inject(WorkflowService);

  @ViewChild('linkContainer') linkContainer?: ElementRef;
  @ViewChild('workflowContainer') workflowContainer?: ElementRef;

  ngAfterViewInit(): void {
    if (this.linkContainer) {
      this.linkService.container = this.linkContainer;
    }
    if (this.workflowContainer) {
      this.workflowService.columnContainer = this.workflowContainer;
    }
  }

  addNode(data: { entry: ConnectableEntryComponent; targetColumn: number }) {
    this.workflowService.addNodeAndLink(data.entry, data.targetColumn);
  }
}
