import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackButtonComponent, SisToastService } from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule, PaIconModule, PaTabsModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { ActivatedRoute, Router } from '@angular/router';
import { IConnector, ISyncEntity, LogEntity, SyncService } from '@nuclia/sync';
import { filter, map, Observable, Subject, switchMap, take, tap } from 'rxjs';
import { SyncSettingsComponent } from './sync-settings';
import { FoldersTabComponent } from './folders-tab/folders-tab.component';

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
  ],
  templateUrl: './sync-details-page.component.html',
  styleUrl: './sync-details-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncDetailsPageComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private currentRoute = inject(ActivatedRoute);
  private syncService = inject(SyncService);
  private toaster = inject(SisToastService);

  private unsubscribeAll = new Subject<void>();

  syncId: Observable<string> = this.currentRoute.params.pipe(
    filter((params) => !!params['syncId']),
    map((params) => params['syncId']),
    tap((syncId) => this.syncService.setCurrentSourceId(syncId)),
  );
  sync: Observable<ISyncEntity> = this.syncId.pipe(switchMap((syncId) => this.syncService.getSync(syncId)));
  connectorDef = this.sync.pipe(map((sync) => this.syncService.connectors[sync.connector.name].definition));
  connector: Observable<IConnector> = this.connectorDef.pipe(
    switchMap((connectorDef) => this.syncService.getConnector(connectorDef.id, '')),
  );
  activityLogs: Observable<LogEntity[]> = this.syncId.pipe(switchMap((syncId) => this.syncService.getLogs(syncId)));

  activeTab: 'settings' | 'folders' = 'settings';

  ngOnInit() {
    this.sync
      .pipe(
        take(1),
        switchMap((sync) =>
          this.syncService.hasCurrentSourceAuth().pipe(
            filter((hasAuth) => !hasAuth),
            switchMap(() => this.syncService.getConnector(sync.connector.name, sync.id)),
            switchMap((connector) => {
              return this.syncService.authenticateToConnector(sync.connector.name, connector);
            }),
          ),
        ),
      )
      .subscribe({
        next: () => this.router.navigate([], { queryParams: {} }),
        error: () => this.toaster.error('sync.details.authentication.fail'),
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  updateSync() {
    this.sync = this.syncId.pipe(switchMap((syncId) => this.syncService.getSync(syncId)));
  }
}
