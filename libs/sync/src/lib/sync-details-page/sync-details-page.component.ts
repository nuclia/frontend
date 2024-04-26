import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackButtonComponent, SisToastService, StickyFooterComponent } from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule, PaIconModule, PaTabsModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IConnector, ISyncEntity, LogEntity, SyncItem, SyncService } from '../logic';
import { filter, map, Observable, Subject, switchMap, take, tap } from 'rxjs';
import { SyncSettingsComponent } from './sync-settings';
import { FoldersTabComponent } from './folders-tab/folders-tab.component';
import { ConfigurationFormComponent } from '../configuration-form';
import { SDKService } from '@flaps/core';
import { FolderSelectionComponent } from '../folder-selection';

@Component({
  selector: 'nsy-sync-details-page',
  standalone: true,
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
  private cdr = inject(ChangeDetectorRef);

  private unsubscribeAll = new Subject<void>();

  kbId = this.sdk.currentKb.pipe(map((kb) => kb.id));
  syncId: Observable<string> = this.currentRoute.params.pipe(
    filter((params) => !!params['syncId']),
    map((params) => params['syncId']),
    tap((syncId) => this.syncService.setCurrentSyncId(syncId)),
  );

  sync: Observable<ISyncEntity> = this.syncService.cacheUpdated.pipe(
    switchMap(() => this.syncId),
    switchMap((syncId) => this.syncService.getSync(syncId)),
  );
  connectorDef = this.sync.pipe(map((sync) => this.syncService.connectors[sync.connector.name].definition));
  connector: Observable<IConnector> = this.connectorDef.pipe(
    switchMap((connectorDef) => this.syncService.getConnector(connectorDef.id, '')),
  );
  activityLogs: Observable<LogEntity[]> = this.syncId.pipe(switchMap((syncId) => this.syncService.getLogs(syncId)));

  activeTab: 'settings' | 'folders' = 'settings';

  editMode: Observable<boolean> = this.currentRoute.url.pipe(
    map((fragments) => fragments.length > 1 && fragments[1].path === 'edit'),
  );
  validForm = false;
  updatedConfig?: ISyncEntity;
  updatedSelection?: SyncItem[];

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
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
    this.syncService.triggerSyncs().subscribe({
      next: () => this.toaster.success('sync.details.toast.triggering-sync-success'),
      error: () => this.toaster.error('sync.details.toast.triggering-sync-failed'),
    });
  }

  deleteSync() {
    this.syncId
      .pipe(
        take(1),
        switchMap((syncId) => this.syncService.deleteSync(syncId)),
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
          delete updatedSync.connector;
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
