import { ChangeDetectionStrategy, Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackButtonComponent, SisModalService, SisToastService, StickyFooterComponent } from '@nuclia/sistema';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PaButtonModule, PaIconModule, PaTabsModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IConnector, ISyncEntity, LogEntity, SyncItem, SyncService } from '../logic';
import { combineLatest, filter, map, Observable, Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import { SyncSettingsComponent } from './sync-settings';
import { FoldersTabComponent } from './folders-tab/folders-tab.component';
import { ConfigurationFormComponent } from '../configuration-form';
import { SDKService } from '@flaps/core';
import { FolderSelectionComponent } from '../folder-selection';

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
    FoldersTabComponent,
    RouterLink,
    StickyFooterComponent,
    ConfigurationFormComponent,
    FolderSelectionComponent,
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
  );
  connectorDef = this.sync.pipe(map((sync) => this.syncService.connectors[sync.connector.name].definition));
  connector: Observable<IConnector> = this.connectorDef.pipe(
    map((connectorDef) => this.syncService.getConnector(connectorDef.id, '')),
  );
  activityLogs: Observable<LogEntity[]> = this.syncId.pipe(switchMap((syncId) => this.syncService.getLogs(syncId)));

  activeTab: 'settings' | 'folders' = 'settings';

  editMode: Observable<boolean> = this.currentRoute.url.pipe(
    map((fragments) => fragments.length > 1 && fragments[1].path === 'edit'),
  );
  validForm = false;
  updatedConfig?: ISyncEntity;
  updatedSelection?: SyncItem[];
  isSyncing: Observable<boolean> = combineLatest([this.syncId, this.syncService.isSyncing]).pipe(
    map(([syncId, isSyncing]) => isSyncing[syncId] || false),
  );

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
    this.modalService
      .openConfirm({
        title: this.translate.instant('sync.details.modal.title'),
        description: 'sync.details.modal.description',
        confirmLabel: 'sync.details.modal.sync-new',
        cancelLabel: 'sync.details.modal.re-sync-all',
      })
      .onClose.pipe(
        switchMap((syncNew: boolean) =>
          this.syncId.pipe(
            take(1),
            switchMap((syncId) => this.syncService.triggerSync(syncId, !syncNew)),
          ),
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
}
