import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConnectorDefinition, IConnector, ISyncEntity, SyncService } from '../logic';
import { filter, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { PaButtonModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { BackButtonComponent, SisModalService, SisToastService, StickyFooterComponent } from '@nuclia/sistema';
import { ConfigurationFormComponent } from './configuration-form';
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

  steps: Observable<('configuration' | 'folder-selection')[]> = this.connector.pipe(
    map((connector) => (connector.allowToSelectFolders ? ['configuration', 'folder-selection'] : ['configuration'])),
  );
  stepIndex = signal(0);
  step = computed(() => this.stepIndex() + 1);

  validForm = false;
  configuration?: ISyncEntity;

  ngOnInit() {
    this.syncService.currentSyncId.pipe(take(1)).subscribe((syncId) => (this.syncId = syncId));
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

  resetConfiguration() {
    // TODO
  }

  save() {
    if (!this.configuration) {
      return;
    }
    const syncEntity = this.configuration;
    if (!this.syncId) {
      this._createSync(syncEntity).subscribe({
        next: (connector) => this._onSuccessfulCreation(connector, syncEntity),
        error: (error) => {
          console.warn(error);
          this.toaster.error('sync.add-page.toast.generic-error');
        },
      });
    } else {
      // TODO
    }
  }

  updateConfiguration(data: ISyncEntity) {
    this.configuration = data;
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
      tap(() => this.syncService.setCurrentSourceId(syncEntity.id)),
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
      this.router.navigate([`../../${syncEntity.id}`], { relativeTo: this.currentRoute });
    } else {
      let basePath = location.href.split('/sync/add/')[0];
      if (this.sdk.nuclia.options.standalone) {
        // NucliaDB admin uses hash routing but the oauth flow does not support it
        // so we remove '#/' from the path and we will restore it in app.component after
        // the oauth flow is completed
        basePath = basePath.replace('#/', '');
      }
      connector.goToOAuth(`${basePath}/sync/${syncEntity.id}`, true);
    }
  }
}
