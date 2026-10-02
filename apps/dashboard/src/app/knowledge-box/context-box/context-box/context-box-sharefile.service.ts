import { inject, Injectable, signal } from '@angular/core';
import { SDKService } from '@flaps/core';
import { ExternalConnection, NucliaDBConfig, SyncConfig, SyncConfiguration, SyncDriver } from '@nuclia/core';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { ISyncEntity, SyncService } from '@nuclia/sync';
import { catchError, combineLatest, map, Observable, of, switchMap, take, tap, throwError } from 'rxjs';
import { ContextBoxService } from './context-box.service';

const SHAREFILE_CONNECTOR_ID = 'sharefile';
const SHAREFILE_DRIVER_IDENTIFIER = 'context-box-sharefile-sync';
const PENDING_NEW_CONNECTOR_KEY = 'PENDING_NEW_CONNECTOR';

@Injectable({
  providedIn: 'root',
})
export class ContextBoxShareFileService {
  private sdk = inject(SDKService);
  private syncService = inject(SyncService);
  private contextBoxService = inject(ContextBoxService);

  private _connectedSource = signal<ISyncEntity | null | undefined>(undefined);
  connectedSource = this._connectedSource.asReadonly();

  constructor() {
    this.loadConnectedSource();
  }

  private loadConnectedSource() {
    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) => this.syncService.getSyncsForKB(kb.id, true)),
        map((syncs) => syncs.find((sync) => sync.connectorId === SHAREFILE_CONNECTOR_ID)),
        switchMap((sync) => (sync ? this.syncService.getSync(sync.id) : of(undefined))),
        catchError(() => of(undefined)),
      )
      .subscribe((sync) => this._connectedSource.set(sync || null));
  }

  connectShareFile(): Observable<string> {
    localStorage.setItem(
      PENDING_NEW_CONNECTOR_KEY,
      JSON.stringify({
        redirect: location.href,
      }),
    );
    return this.syncService.getOAuthUrl('sharefile_oauth');
  }

  getExternalConnection(externalConnectionId: string): Observable<ExternalConnection> {
    return this.syncService.getExternalConnection(externalConnectionId);
  }

  createShareFileSync(
    externalConnectionId: string,
    folder: { folder_id?: string; sync_root_path?: string; drive_id: string },
  ): Observable<SyncConfiguration> {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        this.syncService.addCloudSync({
          name: `ShareFile - ${kb.title || kb.id}`,
          external_connection_id: externalConnectionId,
          folder_id: folder.folder_id,
          sync_root_path: folder.sync_root_path,
          drive_id: folder.drive_id,
        }),
      ),
      switchMap((sync) => this.syncService.triggerSync(sync.id).pipe(map(() => sync))),
      switchMap((sync) => this.addShareFileToAgentWorkflow(sync.id).pipe(map(() => sync))),
      tap(() => this.loadConnectedSource()),
    );
  }

  disconnectShareFile(syncId: string): Observable<void> {
    return this.removeShareFileFromAgentWorkflow().pipe(
      switchMap(() => this.syncService.deleteSync(syncId)),
      tap(() => this._connectedSource.set(null)),
    );
  }

  private addShareFileToAgentWorkflow(syncId: string): Observable<void> {
    return this.contextBoxService.getContextBoxAgent().pipe(
      switchMap((agent) =>
        combineLatest([agent.getDrivers('nucliadb'), agent.getDrivers('sync')]).pipe(
          switchMap(([nucliaDbDrivers, syncDrivers]) => {
            const kbDriver = nucliaDbDrivers[0];
            if (!kbDriver) {
              return throwError(() => new Error('No Knowledge Box driver found on the Retrieval Agent'));
            }
            const syncConfig: SyncConfig = {
              ...(kbDriver.config as NucliaDBConfig),
              connection_ids: [syncId],
            };
            const existingSyncDriver = syncDrivers.find(
              (driver): driver is SyncDriver => driver.identifier === SHAREFILE_DRIVER_IDENTIFIER,
            );
            return existingSyncDriver
              ? agent.patchDriver({ ...existingSyncDriver, config: syncConfig })
              : agent.addDriver({
                  name: 'ShareFile',
                  provider: 'sync',
                  identifier: SHAREFILE_DRIVER_IDENTIFIER,
                  config: syncConfig,
                });
          }),
          switchMap(() => agent.getContext()),
          switchMap((contextAgents) => {
            const syncWired = contextAgents.some((contextAgent) => contextAgent.module === 'sync');
            const ensureSyncStep: Observable<unknown> = syncWired
              ? of(undefined)
              : agent.addContext({ module: 'sync', sources: [SHAREFILE_DRIVER_IDENTIFIER] });
            const askAgent = contextAgents.find((contextAgent) => contextAgent.module === 'ask');
            return ensureSyncStep.pipe(switchMap(() => (askAgent ? agent.deleteContext(askAgent.id) : of(undefined))));
          }),
        ),
      ),
    );
  }

  private removeShareFileFromAgentWorkflow(): Observable<void> {
    return this.contextBoxService.getContextBoxAgent().pipe(
      switchMap((agent) =>
        combineLatest([agent.getDrivers('nucliadb'), agent.getContext()]).pipe(
          switchMap(([nucliaDbDrivers, contextAgents]) => {
            const kbDriver = nucliaDbDrivers[0];
            const askWired = contextAgents.some((contextAgent) => contextAgent.module === 'ask');
            if (askWired || !kbDriver) {
              return of(undefined);
            }
            return agent.addContext({
              module: 'ask',
              sources: [kbDriver.identifier],
              extra_fields: [],
              full_resource: false,
              vllm: true,
            });
          }),
          switchMap(() => agent.getContext()),
          switchMap((contextAgents) => {
            const syncAgent = contextAgents.find((contextAgent) => contextAgent.module === 'sync');
            return syncAgent ? agent.deleteContext(syncAgent.id) : of(undefined);
          }),
          switchMap(() => agent.getDrivers('sync')),
          switchMap((drivers) => {
            const driver = drivers.find((d) => d.identifier === SHAREFILE_DRIVER_IDENTIFIER);
            return driver ? agent.deleteDriver(driver.id) : of(undefined);
          }),
        ),
      ),
    );
  }
}
