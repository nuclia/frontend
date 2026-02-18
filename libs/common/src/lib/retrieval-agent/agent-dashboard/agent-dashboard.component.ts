import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { auditTime, fromEvent, Subject, takeUntil } from 'rxjs';
import { DashboardLayoutService } from '../../base';
import {
  activeSideBar,
  aragUrl,
  ConnectableEntryComponent,
  LinkService,
  sideBarBadge,
  selectedNode,
  sideBarClosing,
  sideBarDescription,
  sideBarLarge,
  sideBarOpen,
  sideBarTitle,
  WorkflowEffectService,
  WorkflowRoot,
  WorkflowRootComponent,
  WorkflowService,
} from './workflow';
import { FeaturesService, SDKService } from '@flaps/core';
import { CommonModule } from '@angular/common';
import { ExportPanelComponent } from './workflow/sidebar/export/export-panel.component';
import { ImportPanelComponent } from './workflow/sidebar/import';
import { BadgeComponent, SisModalService } from '@nuclia/sistema';
import { EndpointModalComponent } from './workflow/sidebar/endpoint/endpoint-modal.component';

@Component({
  imports: [BadgeComponent, TranslateModule, PaButtonModule, WorkflowRootComponent, RouterLink, CommonModule],
  templateUrl: './agent-dashboard.component.html',
  styleUrl: './agent-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AgentDashboardComponent implements AfterViewInit, OnDestroy {
  private linkService = inject(LinkService);
  private workflowService = inject(WorkflowService);
  private layoutService = inject(DashboardLayoutService);
  private workflowEffects = inject(WorkflowEffectService);
  private sdk = inject(SDKService);
  private features = inject(FeaturesService);
  private modelService = inject(SisModalService);

  private unsubscribeAll = new Subject<void>();

  @ViewChild('linkContainer') linkContainer?: ElementRef;
  @ViewChild('workflowContainer') workflowContainer?: ElementRef;
  @ViewChild('sidebarHeader') sidebarHeader?: ElementRef;
  @ViewChild('sidebarContentWrapper') sidebarContentWrapper?: ElementRef;

  aragUrl = aragUrl;
  sideBarTitle = sideBarTitle;
  sideBarDescription = sideBarDescription;
  sideBarBadge = sideBarBadge;
  sideBarOpen = sideBarOpen;
  sideBarClosing = sideBarClosing;
  sideBarLarge = sideBarLarge;
  activeSideBar = activeSideBar;
  isAragWithMemory = this.sdk.isAragWithMemory;
  isAragAdmin = this.features.isAragAdmin;
  selected = selectedNode;

  constructor() {
    effect(() => this.workflowEffects.initEffect());
  }

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

    // Update the links on resize
    fromEvent(window, 'resize')
      .pipe(auditTime(100), takeUntil(this.unsubscribeAll))
      .subscribe(() => this.workflowService.updateAllLinks());
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

  openTest() {
    this.workflowService.openTestSidebar();
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

  import() {
    this.workflowService.openSidebar('import', ImportPanelComponent);
  }

  export() {
    this.workflowService.openSidebar('export', ExportPanelComponent);
  }

  showEndpoint() {
    this.modelService.openModal(EndpointModalComponent);
  }
}
