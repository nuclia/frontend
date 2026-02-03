import { ChangeDetectionStrategy, Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackButtonComponent, SisModalService, SisToastService, StickyFooterComponent } from '@nuclia/sistema';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PaButtonModule, PaIconModule, PaTabsModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IConnector, ISyncEntity, LogEntity, LogSeverityLevel, SyncItem, SyncService } from '../logic';
import {
  combineLatest,
  filter,
  map,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs';
import { SyncSettingsComponent } from './sync-settings';
import { ConfigurationFormComponent } from '../configuration-form';
import { SDKService } from '@flaps/core';
import { Job } from '@nuclia/core';

@Component({
  selector: 'nsy-sync-details-page',
  imports: [
    CommonModule,
    BackButtonComponent,
    TranslateModule,
    PaIconModule,
    PaButtonModule,
    PaButtonModule,
    PaTogglesModule,
    PaTabsModule,
    SyncSettingsComponent,
    RouterLink,
    StickyFooterComponent,
    ConfigurationFormComponent,
  ],
  templateUrl: './sync-details-page.component.html',
  styleUrl: './sync-details-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncDetailsPageComponent implements OnDestroy {
  private router = inject(Router);
  private currentRoute = inject(ActivatedRoute);
  private syncService = inject(SyncService);
  private toaster = inject(SisToastService);
  private sdk = inject(SDKService);
  private modalService = inject(SisModalService);
  private translate = inject(TranslateService);

  private unsubscribeAll = new Subject<void>();
  private isDeleted = new Subject<void>();

  kbId = this.sdk.currentKb.pipe(map((kb) => kb.id));
  syncId: Observable<string> = this.currentRoute.params.pipe(
    filter((params) => !!params['syncId']),
    map((params) => params['syncId']),
    tap((syncId) => this.syncService.setCurrentSyncId(syncId)),
  );

  sync: Observable<ISyncEntity> = this.syncService.cacheUpdated.pipe(
    switchMap(() => this.syncId),
    switchMap((syncId) => this.syncService.getSync(syncId)),
    takeUntil(this.isDeleted),
    shareReplay(1),
  );
  connectorDef = this.sync.pipe(
    map((sync) => this.syncService.connectors[sync.connectorId || sync.connector.name]?.definition || undefined),
  );
  connector: Observable<IConnector | undefined> = this.connectorDef.pipe(
    map((connectorDef) => (connectorDef ? this.syncService.getConnector(connectorDef.id, '') : undefined)),
  );
  activityLogs: Observable<LogEntity[]> = this.syncId.pipe(switchMap((syncId) => this.syncService.getLogs(syncId)));
  activityLogsCloud: Observable<LogEntity[]> = this.syncService.syncJobs.pipe(
    map((jobs) => this.getLogsFromJobs(jobs)),
  );

  editMode: Observable<boolean> = this.currentRoute.url.pipe(
    map((fragments) => fragments.length > 1 && fragments[1].path === 'edit'),
  );
  validForm = false;
  updatedConfig?: ISyncEntity;
  updatedSelection?: SyncItem[];
  isSyncing: Observable<boolean> = combineLatest([this.syncId, this.syncService.isSyncing]).pipe(
    map(([syncId, isSyncing]) => isSyncing[syncId] || false),
  );
  isSyncingCloud = this.syncService.syncJobs.pipe(map((jobs) => ['in_progress', 'pending'].includes(jobs[0]?.status)));

  constructor() {
    this.sync
      .pipe(
        take(1),
        switchMap((sync) => (sync.isCloud ? this.syncService.updateSyncJobs(sync.id) : of(false))),
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
    this.isDeleted.next();
    this.isDeleted.complete();
  }

  toggleSync(active: boolean) {
    this.syncId
      .pipe(
        take(1),
        switchMap((syncId) => this.syncService.updateSync(syncId, { disabled: !active })),
      )
      .subscribe({
        error: () =>
          this.toaster.error(active ? 'sync.details.toast.activating-failed' : 'sync.details.toast.disabling-failed'),
      });
  }

  triggerSync() {
    this.sync
      .pipe(
        take(1),
        switchMap((sync) =>
          sync.isCloud
            ? this.syncService.triggerSync(sync.id)
            : this.modalService
                .openConfirm({
                  title: this.translate.instant('sync.details.modal.title'),
                  description: 'sync.details.modal.description',
                  confirmLabel: 'sync.details.modal.sync-new',
                  cancelLabel: 'sync.details.modal.re-sync-all',
                })
                .onClose.pipe(switchMap((syncNew: boolean) => this.syncService.triggerSync(sync.id, !syncNew))),
        ),
      )
      .subscribe({
        next: () => this.toaster.success('sync.details.toast.triggering-sync-success'),
        error: () => this.toaster.error('sync.details.toast.triggering-sync-failed'),
      });
  }

  deleteSync() {
    this.sync
      .pipe(
        switchMap((sync) =>
          this.modalService
            .openConfirm({
              title: this.translate.instant('sync.confirm.deletion.title', { title: sync.title }),
              description: 'sync.confirm.deletion.description',
              isDestructive: true,
              confirmLabel: 'generic.delete',
            })
            .onClose.pipe(
              filter((confirmed) => !!confirmed),
              tap(() => this.isDeleted.next()),
              switchMap(() => this.syncService.deleteSync(sync.id)),
            ),
        ),
      )
      .subscribe({
        next: () => this.router.navigate(['..'], { relativeTo: this.currentRoute }),
        error: () => this.toaster.error('sync.details.toast.deletion-failed'),
      });
  }

  updateConfiguration(syncEntity: ISyncEntity) {
    this.updatedConfig = syncEntity;
  }

  updateSelection(newSelection: SyncItem[]) {
    this.updatedSelection = newSelection;
  }

  saveChanges() {
    if (!this.updatedConfig && !this.updatedSelection) {
      return;
    }
    this.syncId
      .pipe(
        take(1),
        switchMap((syncId) => {
          const updatedSync: Partial<ISyncEntity> = { ...this.updatedConfig };
          if (this.updatedSelection) {
            updatedSync.foldersToSync = this.updatedSelection;
          }
          return this.syncService.updateSync(syncId, updatedSync);
        }),
      )
      .subscribe({
        next: () => {
          this.toaster.success('sync.details.toast.modification-success');
          this.router.navigate(['..'], { relativeTo: this.currentRoute });
        },
        error: () => this.toaster.error('sync.details.toast.modification-failed'),
      });
  }

  updateFolders(selection: SyncItem[]) {
    this.syncId
      .pipe(
        take(1),
        switchMap((syncId) => this.syncService.updateSync(syncId, { foldersToSync: selection })),
      )
      .subscribe({
        error: () => this.toaster.error('sync.details.toast.modification-failed'),
      });
  }

  getLogsFromJobs(jobs: Job[]) {
    return jobs.reduce((acc, curr) => {
      acc = acc
        .concat(
          (curr.logs || []).map((log) => {
            const { level, message, timestamp, ...extra } = log;
            return {
              level: ['WARNING', 'ERROR', 'EXCEPTION', 'CRITICAL'].includes(level)
                ? LogSeverityLevel.medium
                : LogSeverityLevel.low,
              message,
              createdAt: timestamp,
              origin: '',
              action: '',
              payload: extra,
            };
          }),
        )
        .concat(
          curr.status !== 'completed'
            ? [
                {
                  level: curr.status === 'failed' ? LogSeverityLevel.medium : LogSeverityLevel.low,
                  message: ['pending', 'in_progress'].includes(curr.status)
                    ? 'Checking for changes...'
                    : 'Synchronization failed',
                  createdAt: curr.created_at,
                  origin: '',
                  action: '',
                  payload: { status: curr.status },
                },
              ]
            : [],
        );
      return acc;
    }, [] as LogEntity[]);
  }
}
