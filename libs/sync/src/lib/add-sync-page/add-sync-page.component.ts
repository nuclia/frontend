import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConnectorDefinition, IConnector, ISyncEntity, SyncItem, SyncService } from '../logic';
import { filter, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { PaButtonModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { BackButtonComponent, SisModalService, SisToastService, StickyFooterComponent } from '@nuclia/sistema';
import { ConfigurationFormComponent } from '../configuration-form';
import { FolderSelectionComponent } from '../folder-selection';
import { SDKService } from '@flaps/core';

@Component({
  selector: 'nsy-add-sync-page',
  standalone: true,
  imports: [
    CommonModule,
    BackButtonComponent,
    PaButtonModule,
    PaIconModule,
    StickyFooterComponent,
    TranslateModule,
    ConfigurationFormComponent,
    FolderSelectionComponent,
    RouterLink,
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
  connector: Observable<IConnector> = this.connectorId.pipe(switchMap((id) => this.syncService.getConnector(id, '')));
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
          this.syncId = params['syncId'] as string;
          this.syncService.setCurrentSyncId(this.syncId);
          this.validForm = true;
          this._goNext();
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
            filter((hasAuth) => !hasAuth),
            switchMap(() => this.syncService.getConnector(sync.connector.name, sync.id)),
            switchMap((connector) => {
              return this.syncService.authenticateToConnector(sync.connector.name, connector);
            }),
          );
        }),
      )
      .subscribe({
        next: () => this.router.navigate([], { queryParams: {} }),
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
        )
        .subscribe({
          next: (connector) => this._onSuccessfulCreation(connector, syncEntity),
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
      this._createSync(syncEntity).subscribe({
        next: (connector) => this._onSuccessfulCreation(connector, syncEntity),
        error: (error) => this._errorHandler(error),
      });
    } else if (this.folderSelection.length > 0) {
      const syncId = this.syncId;
      this.syncService.updateSync(syncId, { foldersToSync: this.folderSelection }, true).subscribe({
        next: () => {
          this._navigateToDetails(syncId);
        },
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
      switchMap(() => this.syncService.getConnector(syncEntity.connector.name, syncEntity.id).pipe(take(1))),
      switchMap((connector) => {
        // Setup sync items from the connector itself if the source doesn't allow to select folders
        if (!connector.allowToSelectFolders) {
          if (typeof connector.handleParameters === 'function') {
            connector.handleParameters(syncEntity.connector.parameters);
          }
          return this.syncService
            .updateSync(syncEntity.id, {
              foldersToSync: connector.getStaticFolders(),
            })
            .pipe(
              switchMap(() => this.syncService.getConnector(syncEntity.connector.name, syncEntity.id).pipe(take(1))),
            );
        } else {
          return of(connector);
        }
      }),
    );
  }

  private _onSuccessfulCreation(connector: IConnector, syncEntity: ISyncEntity) {
    if (!connector.hasServerSideAuth) {
      this._navigateToDetails(syncEntity.id);
    } else {
      let basePath = location.href.split('/sync/add/')[0];
      if (this.sdk.nuclia.options.standalone) {
        // NucliaDB admin uses hash routing but the oauth flow does not support it
        // so we remove '#/' from the path and we will restore it in app.component after
        // the oauth flow is completed
        basePath = basePath.replace('#/', '');
      }
      connector.goToOAuth(`${basePath}/sync/add/${syncEntity.connector.name}/${syncEntity.id}`, true);
    }
  }

  private _navigateToDetails(syncId: string) {
    const path = this.syncId ? `../../../${syncId}` : `../../${syncId}`;
    this.router.navigate([path], { relativeTo: this.currentRoute });
  }

  private _errorHandler(error: string) {
    this.saving = false;
    console.warn(error);
    this.toaster.error('sync.add-page.toast.generic-error');
  }
}
