import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { DashboardLayoutService } from '@flaps/common';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import {
  activeSideBar,
  ConnectableEntryComponent,
  LinkService,
  sideBarDescription,
  sideBarOpen,
  sideBarTitle,
  WorkflowRoot,
  WorkflowRootComponent,
  WorkflowService,
} from './workflow';

@Component({
  imports: [CommonModule, TranslateModule, PaButtonModule, WorkflowRootComponent],
  templateUrl: './agent-dashboard.component.html',
  styleUrl: './agent-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AgentDashboardComponent implements AfterViewInit, OnDestroy {
  private linkService = inject(LinkService);
  private workflowService = inject(WorkflowService);
  private layoutService = inject(DashboardLayoutService);

  private unsubscribeAll = new Subject<void>();

  @ViewChild('linkContainer') linkContainer?: ElementRef;
  @ViewChild('workflowContainer') workflowContainer?: ElementRef;
  @ViewChild('sidebarHeader') sidebarHeader?: ElementRef;
  @ViewChild('sidebarContentWrapper') sidebarContentWrapper?: ElementRef;

  sideBarTitle = sideBarTitle;
  sideBarDescription = sideBarDescription;
  sideBarOpen = sideBarOpen;
  activeSideBar = activeSideBar;

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
    if (this.sidebarHeader) {
      this.workflowService.sidebarHeader = this.sidebarHeader;
    }
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
    this.workflowService.cleanWorkflow();
  }

  setRoot(root: WorkflowRoot) {
    this.workflowService.initAndUpdateWorkflow(root).pipe(takeUntil(this.unsubscribeAll)).subscribe();
  }

  openRules() {
    this.workflowService.openRuleSidebar();
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
