import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SDKService } from '@flaps/core';
import { PaButtonModule, PaIconModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
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

// Warning: this key name is declared in both dashboard app.component and in @nuclia/sync
// to avoid making a dependency
const PENDING_NEW_CONNECTOR_KEY = 'PENDING_NEW_CONNECTOR';
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
    PaTogglesModule,
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
  isCloud = this.connectorDefinition.pipe(map((def) => !!def.cloud));
  enterCredentials = true;
  externalConnectorId = '';
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
  useOAuth = false;

  get backPath() {
    return this.syncId ? '../../..' : '../..';
  }

  ngOnInit() {
    this.currentRoute.params
      .pipe(
        filter((params) => !!params['syncId']),
        take(1),
      )
      .subscribe((params) => {
        this.externalConnectorId = params['syncId'];
        this.enterCredentials = false;
        localStorage.removeItem(PENDING_NEW_CONNECTOR_KEY);
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
          switchMap(({ connector }) => this._onSuccessfulCreation(connector, syncEntity)),
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

  authenticate() {
    this.saving = true;
    this.cdr.markForCheck();
    this.connectorDefinition
      .pipe(
        take(1),
        switchMap((connector) => {
          if (connector.oauth_provider && (this.useOAuth || !connector.apikey_provider)) {
            return this.syncService.getOAuthUrl(connector.oauth_provider).pipe(
              map((authorize_url) => {
                localStorage.setItem(
                  PENDING_NEW_CONNECTOR_KEY,
                  JSON.stringify({
                    redirect: location.href,
                  }),
                );
                // it will redirect to an oauth url, so the rest of the observable pipe will never happen
                this.performOAuth(authorize_url);
                throw 'Will redirect to oauth now.';
              }),
            );
          }
          if (connector.cloud && connector.apikey_provider && this.configuration) {
            return this.syncService
              .addExternalConnection(connector.apikey_provider, this.configuration.connector.parameters)
              .pipe(tap((data) => (this.externalConnectorId = data.id)));
          }
          return of(undefined);
        }),
      )
      .subscribe(() => {
        this.saving = false;
        this.cdr.markForCheck();
      });
  }

  save() {
    if (!this.configuration) {
      return;
    }
    this.saving = true;
    const syncEntity = this.configuration;
    if (!this.syncId) {
      this._createSync(syncEntity)
        .pipe(switchMap(({ connector }) => this._onSuccessfulCreation(connector, syncEntity)))
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

  private _createSync(syncEntity: ISyncEntity): Observable<{ connector: IConnector }> {
    return this.connectorDefinition.pipe(
      take(1),
      switchMap((connector) => {
        const isCloud = connector.cloud;
        if (isCloud && connector.apikey_provider) {
          if (!this.externalConnectorId) {
            throw 'No external connection id';
          }
          return this.syncService
            .addCloudSync({
              name: syncEntity.title,
              external_connection_id: this.externalConnectorId,
              sync_root_path: syncEntity.connector.parameters['sync_root_path'],
            })
            .pipe(
              tap(() => this.syncService.setCurrentSyncId(syncEntity.id)),
              map(() => ({ connector: this.syncService.getConnector(syncEntity.connector.name, syncEntity.id) })),
            );
        } else {
          return this.syncService.addSync(syncEntity).pipe(
            tap(() => this.syncService.setCurrentSyncId(syncEntity.id)),
            switchMap(() => {
              const connector = this.syncService.getConnector(syncEntity.connector.name, syncEntity.id);
              // Setup sync items from the connector itself if the source doesn't allow to select folders
              if (!connector.allowToSelectFolders && !isCloud) {
                if (typeof connector.handleParameters === 'function') {
                  connector.handleParameters(syncEntity.connector.parameters);
                }
                return this.syncService
                  .updateSync(syncEntity.id, {
                    foldersToSync: connector.getStaticFolders(),
                  })
                  .pipe(
                    map(() => ({
                      connector: this.syncService.getConnector(syncEntity.connector.name, syncEntity.id),
                    })),
                  );
              } else {
                return of({ connector });
              }
            }),
          );
        }
      }),
    );
  }

  private _onSuccessfulCreation(connector: IConnector, syncEntity: ISyncEntity): Observable<void> {
    if (!connector.hasServerSideAuth) {
      return this._syncCreationDone(syncEntity.id);
    } else {
      return of();
    }
  }

  private performOAuth(authorize_url?: string) {
    if (!authorize_url) {
      return;
    }
    window.location.href = authorize_url;
  }

  private _syncCreationDone(syncId: string): Observable<void> {
    return of(true).pipe(
      tap(() => {
        const path = this.syncId ? `../../../${syncId}` : `../../${syncId}`;
        this.router.navigate([path], { relativeTo: this.currentRoute });
      }),
      switchMap(() => this.syncService.useCloudSync),
      take(1),
      switchMap((useCloud) => {
        if (useCloud) {
          return of();
        } else {
          this.toaster.success('sync.details.toast.triggering-sync-success');
          return this.syncService.triggerSync(syncId).pipe(
            catchError(() => {
              this.toaster.error('sync.details.toast.triggering-sync-failed');
              return of();
            }),
          );
        }
      }),
    );
  }

  private _errorHandler(error: string) {
    this.saving = false;
    console.warn(error);
    this.toaster.error('sync.add-page.toast.generic-error');
  }
}
