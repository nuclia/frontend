import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FeaturesService, SDKService, ZoneService } from '@flaps/core';
import {
  HeaderCell,
  ModalConfig,
  PaButtonModule,
  PaDateTimeModule,
  PaDropdownModule,
  PaIconModule,
  PaPopupModule,
  PaTableModule,
  PaTabsModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  BadgeComponent,
  DropdownButtonComponent,
  InfoCardComponent,
  SisModalService,
  SisStatusComponent,
  SisToastService,
} from '@nuclia/sistema';
import { combineLatest, filter, forkJoin, map, Observable, Subject, switchMap, take, takeUntil } from 'rxjs';
import { ConnectorDefinition, LOCAL_SYNC_SERVER, SyncBasicData, SyncServerType, SyncService } from '../logic';
import { ConnectorComponent } from './connector';
import {
  EditSourceModalData,
  EditSourceModalResult,
  KbConnection,
  KbConnectionsService,
  RaoEditSourceModalComponent,
} from '@flaps/common';

@Component({
  imports: [
    CommonModule,
    BadgeComponent,
    ConnectorComponent,
    DropdownButtonComponent,
    PaButtonModule,
    PaDropdownModule,
    PaTextFieldModule,
    PaTogglesModule,
    PaTooltipModule,
    ReactiveFormsModule,
    TranslateModule,
    PaTableModule,
    PaTabsModule,
    RouterLink,
    PaIconModule,
    PaDateTimeModule,
    InfoCardComponent,
    PaPopupModule,
    RaoEditSourceModalComponent,
    SisStatusComponent,
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent implements OnInit, AfterViewInit, OnDestroy {
  private router = inject(Router);
  private currentRoute = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private syncService = inject(SyncService);
  private sdk = inject(SDKService);
  private toaster = inject(SisToastService);
  private modalService = inject(SisModalService);
  private translate = inject(TranslateService);
  private features = inject(FeaturesService);
  private zoneService = inject(ZoneService);
  private connectionsService = inject(KbConnectionsService);

  private unsubscribeAll = new Subject<void>();

  selectedTab: 'connect' | 'synchronize' = 'connect';
  connectSourceControl = new FormControl<string>('kb', { nonNullable: true });
  kbDescriptionControl = new FormControl<string>('', { nonNullable: true });
  currentKb = this.sdk.currentKb;

  connections = this.connectionsService.connections;
  connectedKbIds = computed(() => new Set(this.connections().map((c) => c.id)));
  expandedConnections = signal<Record<string, boolean>>({});
  readonly SHORT_DESC_LENGTH = 80;

  mcpForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    url: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    key: new FormControl('', { nonNullable: true }),
    timeout: new FormControl<number | null>(null),
  });

  connectionsTableHeader: HeaderCell[] = [
    new HeaderCell({ id: 'name', label: 'sync.home-page.connections.table-columns.name' }),
    new HeaderCell({ id: 'type', label: 'sync.home-page.connections.table-columns.type' }),
    new HeaderCell({ id: 'description', label: 'sync.home-page.connections.table-columns.description' }),
    new HeaderCell({ id: 'actions', label: 'sync.home-page.connections.table-columns.actions' }),
  ];

  readonly connectionTypeLogos: Partial<Record<string, string>> = {
    perplexity: 'assets/connector-logos/perplexity.svg',
  };
  private sectionObserver?: IntersectionObserver;
  private readonly sectionTabs: Array<'connect' | 'synchronize'> = ['connect', 'synchronize'];

  // TODO: download dropdown is placed in the layout but will be implemented in https://app.shortcut.com/flaps/story/9739/setup-sync-agent-download-dropdown
  downloadSyncAgentFeature = false;

  hasCloudSync = this.features.unstable.cloudSyncService;
  useCloudSync = this.syncService.useCloudSync;
  inactiveServer = this.syncService.isServerDown;
  syncAgentForm = new FormGroup({
    type: new FormControl<SyncServerType>('desktop', { nonNullable: true }),
    serverUrl: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  connectors = this.syncService.connectors;
  currentZone = forkJoin([this.zoneService.getZones(), this.sdk.currentKb.pipe(take(1))]).pipe(
    map(([zones, kb]) => zones.find((zone) => zone.slug === kb.zone)),
  );

  private _connectorList: Observable<ConnectorDefinition[]> = forkJoin([
    this.syncService.connectorsObs.pipe(take(1)),
    this.features.unstable.cloudSyncSharepoint.pipe(take(1)),
    this.currentZone,
  ]).pipe(
    map(([sources, hasSharepoint, zone]) =>
      sources
        .filter((conn) => {
          const hidden =
            (conn.id === 'sharepoint' && !hasSharepoint) || (conn.id === 's3' && zone?.cloud_provider !== 'AWS');
          return !hidden;
        })
        .sort((a, b) => a.title.localeCompare(b.title)),
    ),
  );
  connectorList: Observable<ConnectorDefinition[]> = this._connectorList.pipe(
    map((connectors) => connectors.filter((connector) => !connector.cloud)),
  );
  cloudConnectorList: Observable<ConnectorDefinition[]> = this._connectorList.pipe(
    map((connectors) => connectors.filter((connector) => connector.cloud)),
  );
  serverUrlBackup = '';

  syncs: Observable<SyncBasicData[]> = combineLatest([
    this.syncService.cacheUpdated,
    this.syncService.useCloudSync,
  ]).pipe(
    switchMap(([, useCloud]) => this.sdk.currentKb.pipe(map((kb) => ({ kb, useCloud })))),
    switchMap(({ kb, useCloud }) => this.syncService.getSyncsForKB(kb.id, useCloud)),
  );
  syncTableHeader: HeaderCell[] = [
    new HeaderCell({ id: 'name', label: 'sync.home-page.sync-list.table-columns.name' }),
    new HeaderCell({ id: 'connector', label: 'sync.home-page.sync-list.table-columns.connector' }),
    new HeaderCell({ id: 'resources', label: 'sync.home-page.sync-list.table-columns.resources' }),
    new HeaderCell({ id: 'sync', label: 'sync.home-page.sync-list.table-columns.sync' }),
    /* FIXME with https://app.shortcut.com/flaps/story/9875/resource-uploaded-and-activity-log-details-in-sync-agent
    new HeaderCell({
      id: 'creation-date',
      label: 'sync.home-page.sync-list.table-columns.creation-date',
      sortable: true,
    }), */
    new HeaderCell({ id: 'latest-sync', label: 'sync.home-page.sync-list.table-columns.latest-sync', sortable: true }),
    new HeaderCell({ id: 'actions', label: 'sync.home-page.sync-list.table-columns.actions' }),
  ];

  get syncAgentOnServer() {
    return this.syncAgentForm.controls.type.value === 'server';
  }
  get syncAgentOnDesktop() {
    return this.syncAgentForm.controls.type.value === 'desktop';
  }
  get syncAgentTypeControl() {
    return this.syncAgentForm.controls.type;
  }
  get syncServerUrl() {
    return this.syncAgentForm.controls.serverUrl.value;
  }

  get serverUrlChanged() {
    return this.serverUrlBackup !== this.syncServerUrl;
  }

  ngOnInit() {
    this.syncService.syncServer.pipe(take(1)).subscribe((syncServer) => {
      this.syncAgentForm.patchValue(syncServer);
      this.serverUrlBackup = syncServer.serverUrl;
    });

    this.syncAgentTypeControl.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => this.saveSyncServer());
  }

  ngOnDestroy() {
    this.sectionObserver?.disconnect();
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  ngAfterViewInit(): void {
    this.initSectionObserver();
  }

  goToSection(section: 'connect' | 'synchronize') {
    this.selectedTab = section;
    this.cdr.markForCheck();
    const target = document.getElementById(`sync-${section}`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private initSectionObserver() {
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    this.sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length === 0) {
          return;
        }

        const section = visible[0].target.id.replace('sync-', '') as 'connect' | 'synchronize';

        if (this.selectedTab !== section) {
          this.selectedTab = section;
          this.cdr.markForCheck();
        }
      },
      {
        root: null,
        rootMargin: '-140px 0px -45% 0px',
        threshold: [0.2, 0.4, 0.6],
      },
    );

    this.sectionTabs.forEach((section) => {
      const element = document.getElementById(`sync-${section}`);
      if (element) {
        this.sectionObserver?.observe(element);
      }
    });
  }

  saveSyncServer() {
    this.syncService.updateUseCloudSync(this.syncAgentTypeControl.value === 'cloud');
    if (this.syncAgentForm.valid) {
      const syncAgentConfig = this.syncAgentForm.getRawValue();
      const serverUrl = syncAgentConfig.type === 'server' ? syncAgentConfig.serverUrl : LOCAL_SYNC_SERVER;
      this.syncService.setSyncServer(serverUrl, syncAgentConfig.type);
    }
  }

  onSelectConnector(connector: ConnectorDefinition) {
    this.router.navigate(['./add', connector.id], { relativeTo: this.currentRoute });
  }

  toggleConnectionDesc(id: string) {
    this.expandedConnections.update((state) => ({ ...state, [id]: !state[id] }));
  }

  connectKb(kb: { id: string; title: string }) {
    this.connectionsService.addOrUpdate({
      id: kb.id,
      type: 'kb',
      label: kb.title,
      description: this.kbDescriptionControl.value,
    });
    this.kbDescriptionControl.reset('');
  }

  connectMcp() {
    if (this.mcpForm.invalid) {
      return;
    }
    const { name, description, url, key, timeout } = this.mcpForm.getRawValue();
    this.connectionsService.addOrUpdate({
      id: crypto.randomUUID(),
      type: 'mcp',
      label: name,
      description,
      url,
      key: key || undefined,
      timeout: timeout ?? undefined,
    });
    this.mcpForm.reset();
  }

  editConnection(source: KbConnection) {
    this.modalService
      .openModal(
        RaoEditSourceModalComponent,
        new ModalConfig<EditSourceModalData>({
          data: { sourceLabel: source.label, description: source.description },
        }),
      )
      .onClose.pipe(filter((result): result is EditSourceModalResult => !!result && typeof result === 'object'))
      .subscribe(({ label, description }) => {
        this.connectionsService.update(source.id, { label, description });
      });
  }

  selectThirdParty(app: string) {
    this.router.navigate(['./connect-third-party', app], { relativeTo: this.currentRoute });
  }

  deleteConnection(connection: KbConnection) {
    this.modalService
      .openConfirm({
        title: this.translate.instant('sync.confirm.connection-deletion.title', { title: connection.label }),
        description: 'sync.confirm.connection-deletion.description',
        isDestructive: true,
        confirmLabel: 'generic.delete',
      })
      .onClose.pipe(filter((confirmed) => !!confirmed))
      .subscribe(() => {
        this.connectionsService.remove(connection.id);
      });
  }

  deleteSync(sync: SyncBasicData) {
    this.modalService
      .openConfirm({
        title: this.translate.instant('sync.confirm.deletion.title', { title: sync.title }),
        description: 'sync.confirm.deletion.description',
        isDestructive: true,
        confirmLabel: 'generic.delete',
      })
      .onClose.pipe(
        filter((confirmed) => !!confirmed),
        switchMap(() => this.syncService.deleteSync(sync.id)),
      )
      .subscribe({
        error: () => this.toaster.error('sync.details.toast.deletion-failed'),
      });
  }

  toggleSync(id: string, active: boolean) {
    this.syncService.updateSync(id, { disabled: !active }).subscribe({
      error: () =>
        this.toaster.error(active ? 'sync.details.toast.activating-failed' : 'sync.details.toast.disabling-failed'),
    });
  }
}
