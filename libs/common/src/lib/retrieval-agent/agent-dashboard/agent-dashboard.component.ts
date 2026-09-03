import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ModalConfig,
  PaButtonModule,
  PaDropdownModule,
  PaPopupModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { auditTime, combineLatest, filter, fromEvent, map, Subject, switchMap, take, takeUntil } from 'rxjs';
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
  SidebarType,
  WorkflowEffectService,
  workflowId,
  WorkflowRoot,
  WorkflowRootComponent,
  WorkflowService,
} from './workflow';
import { FeaturesService, SDKService } from '@flaps/core';
import { CommonModule } from '@angular/common';
import { ExportPanelComponent } from './workflow/sidebar/export/export-panel.component';
import { ImportPanelComponent } from './workflow/sidebar/import';
import { BadgeComponent, DropdownButtonComponent, SisModalService, SisToastService } from '@nuclia/sistema';
import { WorkflowsService } from '../workflows';
import { WorkflowModalComponent } from '../workflows/workflow-modal';
import { toObservable } from '@angular/core/rxjs-interop';

const OVERFLOW_SIDEBARS: SidebarType[] = ['rules', 'import', 'export'];

@Component({
  imports: [
    BadgeComponent,
    CommonModule,
    DropdownButtonComponent,
    PaButtonModule,
    PaDropdownModule,
    PaPopupModule,
    PaTooltipModule,
    TranslateModule,
    WorkflowRootComponent,
  ],
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
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private workflowsService = inject(WorkflowsService);
  private modalService = inject(SisModalService);
  private toaster = inject(SisToastService);

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
  // Rules, import and export are collapsed into the toolbar overflow menu, so their
  // open state is surfaced on the menu trigger instead of on the actions themselves.
  overflowMenuActive = computed(() => OVERFLOW_SIDEBARS.includes(activeSideBar() as SidebarType));
  isAragWithMemory = this.sdk.isAragWithMemory;
  isAragAdmin = this.features.isAragAdmin;
  selected = selectedNode;
  workflows = this.workflowsService.workflows;
  currentWorkflow = combineLatest([this.workflows, toObservable(workflowId)]).pipe(
    map(([workflows, workflowId]) => workflows.find((item) => item.id === workflowId)),
  );

  constructor() {
    effect(() => this.workflowEffects.initEffect());

    this.route.params.pipe(filter((params) => !!params['id'])).subscribe((params) => {
      workflowId.set(params['id']);
    });

    toObservable(workflowId)
      .pipe(
        switchMap((workflowId) =>
          this.sdk.currentArag.pipe(
            take(1),
            map((arag) => ({ workflowId, arag })),
          ),
        ),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(({ workflowId, arag }) => {
        // Remember this as the last workflow visited for this agent, so the next time the
        // user enters the agent they land back here instead of on the workflows list.
        if (workflowId) {
          this.workflowsService.setLastWorkflowId(arag.slug, workflowId || '');
        }
      });
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
    // Collapsing the nav is only actionable from within the canvas toolbar (no other
    // page exposes a way to re-expand it), so restore it whenever the canvas is left,
    // regardless of exit path (back button, browser back/forward, deep link, etc.).
    this.layoutService.expandNav();
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

  closeSidebar() {
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

  goToWorkflow(workflowId: string) {
    this.router.navigate([`../${workflowId}`], { relativeTo: this.route });
  }

  goToSessions() {
    this.router.navigate([`${this.aragUrl()}/sessions`]);
  }

  backToWorkflows() {
    this.router.navigate([`${this.aragUrl()}/workflows`]);
  }

  addWorkflow() {
    this.workflowsService.workflows
      .pipe(
        take(1),
        switchMap(
          (workflows) =>
            this.modalService.openModal(WorkflowModalComponent, new ModalConfig({ data: { workflows } })).onClose,
        ),
        filter((workflow) => !!workflow),
        // createWorkflow returns void, so we navigate using the slug generated by the
        // modal, and only once creation succeeded to avoid landing on a missing workflow.
        switchMap((workflow) => this.workflowsService.createWorkflow(workflow).pipe(map(() => workflow))),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe({
        next: (workflow) => this.goToWorkflow(workflow.id),
        error: () => this.toaster.error('retrieval-agents.workflows-list.errors.creation'),
      });
  }
}
