import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SDKService } from '@flaps/core';
import { PaButtonModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  BackButtonComponent,
  SisModalService,
  SisProgressModule,
  SisToastService,
  StickyFooterComponent,
} from '@nuclia/sistema';
import { catchError, filter, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { ConfigurationFormComponent } from '../configuration-form';
import { FolderSelectionComponent } from '../folder-selection';
import { ConnectorDefinition, IConnector, ISyncEntity, SyncItem, SyncService } from '../logic';

@Component({
  selector: 'nsy-add-sync-page',
  imports: [
    CommonModule,
    BackButtonComponent,
    PaButtonModule,
    PaIconModule,
    StickyFooterComponent,
    TranslateModule,
    ConfigurationFormComponent,
    FolderSelectionComponent,
    SisProgressModule,
  ],
  templateUrl: './add-sync-page.component.html',
  styleUrl: './add-sync-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddSyncPageComponent implements OnInit {
  private router = inject(Router);
  private currentRoute = inject(ActivatedRoute);
  private sdk = inject(SDKService);
  private syncService = inject(SyncService);
  private modalService = inject(SisModalService);
  private translate = inject(TranslateService);
  private toaster = inject(SisToastService);
  private cdr = inject(ChangeDetectorRef);

  connectorId = this.currentRoute.params.pipe(
    filter((params) => params['connector']),
    map((params) => params['connector'] as string),
  );
  connectorDefinition: Observable<ConnectorDefinition> = this.connectorId.pipe(
    map((id) => this.syncService.getConnectorDefinition(id)),
  );
  connector: Observable<IConnector> = this.connectorId.pipe(map((id) => this.syncService.getConnector(id, '')));
  kbId = this.sdk.currentKb.pipe(map((kb) => kb.id));

  syncId?: string | null;
  sync?: ISyncEntity | null;

  steps: Observable<('configuration' | 'folder-selection')[]> = this.connector.pipe(
    map((connector) => (connector.allowToSelectFolders ? ['configuration', 'folder-selection'] : ['configuration'])),
  );
  stepIndex = signal(0);
  step = computed(() => this.stepIndex() + 1);

  validForm = false;
  configuration?: ISyncEntity;
  folderSelection: SyncItem[] = [];
  loading = false;
  saving = false;

  get backPath() {
    return this.syncId ? '../../..' : '../..';
  }

  ngOnInit() {
    this.currentRoute.params
      .pipe(
        filter((params) => !!params['syncId']),
        take(1),
        tap((params) => {
          this.loading = true;
          this.cdr.markForCheck();
          this.syncId = params['syncId'] as string;
          this.syncService.setCurrentSyncId(this.syncId);
          this.validForm = true;
        }),
        switchMap(() => this.syncService.getSync(this.syncId as string)),
        tap((sync) => {
          // We keep the distinction between loaded sync and configuration from the form to make sure the configurationForm component
          // will trigger the sync setter only once
          this.sync = sync;
          this.configuration = sync;
          this.cdr.markForCheck();
        }),
        switchMap((sync) => {
          return this.syncService.hasCurrentSourceAuth().pipe(
            tap((hasAuth) => {
              if (hasAuth) {
                this.loading = false;
                this.cdr.markForCheck();
              }
            }),
            filter((hasAuth) => !hasAuth),
            map(() => this.syncService.getConnector(sync.connector.name, sync.id)),
            switchMap((connector) => {
              return this.syncService.authenticateToConnector(sync.connector.name, connector);
            }),
          );
        }),
      )
      .subscribe({
        next: () => {
          this._goNext();
          this.loading = false;
          this.cdr.markForCheck();
          this.router.navigate([], { queryParams: {} });
        },
        error: () => this.toaster.error('sync.details.authentication.fail'),
      });
  }

  goBack() {
    if (this.stepIndex() > 0) {
      this.stepIndex.update((value) => value - 1);
    }
  }

  goNext() {
    if (!this.configuration) {
      return;
    }
    const syncEntity = this.configuration;
    if (!this.syncId) {
      this.connectorDefinition
        .pipe(
          take(1),
          switchMap(
            (connectorDef) =>
              this.modalService.openConfirm({
                title: this.translate.instant('sync.add-page.confirm-authenticate.title', {
                  connector: connectorDef.title,
                }),
                description: this.translate.instant('sync.add-page.confirm-authenticate.description'),
                confirmLabel: this.translate.instant('sync.add-page.confirm-authenticate.confirm-button'),
              }).onClose,
          ),
          filter((confirmed) => !!confirmed),
          switchMap(() => this._createSync(syncEntity)),
          switchMap((connector) => this._onSuccessfulCreation(connector, syncEntity)),
        )
        .subscribe({
          error: (error) => {
            console.warn(error);
            this.toaster.error('sync.add-page.toast.generic-error');
          },
        });
    } else {
      this._goNext();
    }
  }

  cancel() {
    if (!this.syncId) {
      this.router.navigate([this.backPath], { relativeTo: this.currentRoute });
    } else {
      this.modalService
        .openConfirm({
          title: 'sync.confirm.cancel-oauth.title',
          description: 'sync.confirm.cancel-oauth.description',
          isDestructive: true,
          confirmLabel: 'sync.confirm.cancel-oauth.confirm-label',
          cancelLabel: 'sync.confirm.cancel-oauth.cancel-label',
        })
        .onClose.pipe(
          filter((confirm) => !!confirm),
          switchMap(() => this.syncService.deleteSync(this.syncId as string)),
        )
        .subscribe({
          next: () => this.router.navigate([this.backPath], { relativeTo: this.currentRoute }),
        });
    }
  }

  save() {
    if (!this.configuration) {
      return;
    }
    this.saving = true;
    const syncEntity = this.configuration;
    if (!this.syncId) {
      this._createSync(syncEntity)
        .pipe(switchMap((connector) => this._onSuccessfulCreation(connector, syncEntity)))
        .subscribe({
          error: (error) => this._errorHandler(error),
        });
    } else if (this.folderSelection.length > 0) {
      const syncId = this.syncId;
      this.syncService
        .updateSync(syncId, { foldersToSync: this.folderSelection }, true)
        .pipe(switchMap(() => this._syncCreationDone(syncId)))
        .subscribe({
          error: (error) => this._errorHandler(error),
        });
    }
  }

  updateConfiguration(data: ISyncEntity) {
    this.configuration = data;
  }

  updateSelection(selection: SyncItem[]) {
    this.folderSelection = selection;
  }

  private _goNext() {
    this.steps.pipe(take(1)).subscribe((steps) => {
      if (this.stepIndex() < steps.length) {
        this.stepIndex.update((value) => value + 1);
      }
    });
  }

  private _createSync(syncEntity: ISyncEntity) {
    return this.syncService.addSync(syncEntity).pipe(
      tap(() => this.syncService.setCurrentSyncId(syncEntity.id)),
      map(() => this.syncService.getConnector(syncEntity.connector.name, syncEntity.id)),
      switchMap((connector: IConnector) => {
        // Setup sync items from the connector itself if the source doesn't allow to select folders
        if (!connector.allowToSelectFolders) {
          if (typeof connector.handleParameters === 'function') {
            connector.handleParameters(syncEntity.connector.parameters);
          }
          return this.syncService
            .updateSync(syncEntity.id, {
              foldersToSync: connector.getStaticFolders(),
            })
            .pipe(map(() => this.syncService.getConnector(syncEntity.connector.name, syncEntity.id)));
        } else {
          return of(connector);
        }
      }),
    );
  }

  private _onSuccessfulCreation(connector: IConnector, syncEntity: ISyncEntity): Observable<void> {
    if (!connector.hasServerSideAuth) {
      return this._syncCreationDone(syncEntity.id);
    } else {
      let basePath = location.href.split('/sync/add/')[0];
      if (this.sdk.nuclia.options.standalone) {
        // NucliaDB admin uses hash routing but the oauth flow does not support it
        // so we remove '#/' from the path and we will restore it in app.component after
        // the oauth flow is completed
        basePath = basePath.replace('#/', '');
      }
      connector.goToOAuth(`${basePath}/sync/add/${syncEntity.connector.name}/${syncEntity.id}`, true);
      return of();
    }
  }

  private _syncCreationDone(syncId: string): Observable<void> {
    return of(true).pipe(
      tap(() => {
        const path = this.syncId ? `../../../${syncId}` : `../../${syncId}`;
        this.router.navigate([path], { relativeTo: this.currentRoute });
      }),
      switchMap(() => {
        this.toaster.success('sync.details.toast.triggering-sync-success');
        return this.syncService.triggerSync(syncId).pipe(
          catchError(() => {
            this.toaster.error('sync.details.toast.triggering-sync-failed');
            return of();
          }),
        );
      }),
    );
  }

  private _errorHandler(error: string) {
    this.saving = false;
    console.warn(error);
    this.toaster.error('sync.add-page.toast.generic-error');
  }
}
