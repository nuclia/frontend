import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  HeaderCell,
  PaButtonModule,
  PaDateTimeModule,
  PaDropdownModule,
  PaIconModule,
  PaPopupModule,
  PaTableModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { filter, map, Observable, Subject, switchMap, take, takeUntil } from 'rxjs';
import {
  BadgeComponent,
  DropdownButtonComponent,
  InfoCardComponent,
  SisModalService,
  SisToastService,
} from '@nuclia/sistema';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConnectorDefinition, LOCAL_SYNC_SERVER, SyncBasicData, SyncServerType, SyncService } from '../logic';
import { ConnectorComponent } from './connector';
import { SDKService } from '@flaps/core';

@Component({
  standalone: true,
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
    RouterOutlet,
    TranslateModule,
    PaTableModule,
    RouterLink,
    PaIconModule,
    PaDateTimeModule,
    PaTogglesModule,
    InfoCardComponent,
    PaDropdownModule,
    PaPopupModule,
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private currentRoute = inject(ActivatedRoute);
  private syncService = inject(SyncService);
  private sdk = inject(SDKService);
  private toaster = inject(SisToastService);
  private modalService = inject(SisModalService);
  private translate = inject(TranslateService);

  private unsubscribeAll = new Subject<void>();

  // TODO: download dropdown is placed in the layout but will be implemented in https://app.shortcut.com/flaps/story/9739/setup-sync-agent-download-dropdown
  downloadSyncAgentFeature = false;

  inactiveServer = this.syncService.isServerDown;
  syncAgentForm = new FormGroup({
    type: new FormControl<SyncServerType>('desktop', { nonNullable: true }),
    serverUrl: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  connectors = this.syncService.connectors;
  connectorList = this.syncService.connectorsObs.pipe(
    map((sources) => sources.sort((a, b) => a.title.localeCompare(b.title))),
  );
  serverUrlBackup = '';

  syncs: Observable<SyncBasicData[]> = this.syncService.cacheUpdated.pipe(
    switchMap(() => this.sdk.currentKb),
    switchMap((kb) => this.syncService.getSyncsForKB(kb.id)),
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
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  saveSyncServer() {
    if (this.syncAgentForm.valid) {
      const syncAgentConfig = this.syncAgentForm.getRawValue();
      const serverUrl = syncAgentConfig.type === 'server' ? syncAgentConfig.serverUrl : LOCAL_SYNC_SERVER;
      this.syncService.setSyncServer(serverUrl, syncAgentConfig.type);
    }
  }

  onSelectConnector(connector: ConnectorDefinition) {
    this.router.navigate(['./add', connector.id], { relativeTo: this.currentRoute });
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
        error: () => this.toaster.error('sync.details.deletion-failed'),
      });
  }

  toggleSync(id: string, active: boolean) {
    this.syncService.updateSync(id, { disabled: !active }).subscribe({
      error: () =>
        this.toaster.error(active ? 'sync.details.toast.activating-failed' : 'sync.details.toast.disabling-failed'),
    });
  }
}
