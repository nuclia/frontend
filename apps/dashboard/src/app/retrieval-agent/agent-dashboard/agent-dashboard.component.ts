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
import { DashboardLayoutService } from '@flaps/common';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { LinkService, WorkflowRoot, WorkflowRootComponent, WorkflowService } from './workflow';
import { ConnectableEntryComponent } from './workflow/basic-elements';

@Component({
  imports: [CommonModule, TranslateModule, PaButtonModule, WorkflowRootComponent],
  templateUrl: './agent-dashboard.component.html',
  styleUrl: './agent-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AgentDashboardComponent implements AfterViewInit {
  private linkService = inject(LinkService);
  private workflowService = inject(WorkflowService);
  private layoutService = inject(DashboardLayoutService);

  @ViewChild('linkContainer') linkContainer?: ElementRef;
  @ViewChild('workflowContainer') workflowContainer?: ElementRef;
  @ViewChild('sidebarContentWrapper') sidebarContentWrapper?: ElementRef;

  sideBarTitle = this.workflowService.sideBarTitle;
  sideBarDescription = this.workflowService.sideBarDescription;
  sideBarOpen = this.workflowService.sideBarOpen;
  activeSideBar = this.workflowService.activeSideBar;

  ngAfterViewInit(): void {
    if (this.linkContainer) {
      this.linkService.container = this.linkContainer;
    }
    if (this.workflowContainer) {
      this.workflowService.columnContainer = this.workflowContainer;
    }
    if (this.sidebarContentWrapper) {
      this.workflowService.sidebarContentWrapper = this.sidebarContentWrapper;
    }
  }

  setRoot($event: WorkflowRoot) {
    this.workflowService.workflowRoot = $event;
  }

  openRules() {
    this.workflowService.openSidebar('rules');
  }

  addNode() {
    this.workflowService.triggerAddNode();
  }

  addNodeFromEntry(data: { entry: ConnectableEntryComponent; targetColumn: number }) {
    this.workflowService.triggerNodeCreation(data.entry, data.targetColumn);
  }

  closeSideBar() {
    this.workflowService.closeSidebar();
  }

  toggleMainNav() {
    this.layoutService.toggleNav();
  }
}
