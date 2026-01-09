import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, filter, forkJoin, map, Observable, of, switchMap, take, tap } from 'rxjs';
import {
  baseLogoPath,
  ConnectorDefinition,
  IConnector,
  ISyncEntity,
  LogEntity,
  SearchResults,
  SyncBasicData,
} from './models';
import { BackendConfigurationService, FeaturesService, NotificationService, SDKService } from '@flaps/core';
import { SitemapConnector } from './connectors/sitemap';
import {
  NucliaOptions,
  WritableKnowledgeBox,
  SyncConfiguration,
  SyncConfigurationCreate,
  ExternalConnectionCredentials,
  ExternalConnection,
} from '@nuclia/core';
import { HttpClient } from '@angular/common/http';
import { FolderConnector } from './connectors/folder';
import { ConfluenceConnector } from './connectors/confluence';
import { RSSConnector } from './connectors/rss';
import { OAuthConnector } from './connectors/oauth';
import { compareDesc } from 'date-fns';
import { SitefinityConnector } from './connectors/sitefinity';
import { SharepointImpl } from './connectors/sharepoint';

export type SyncServerType = 'desktop' | 'server' | 'cloud';
export const LOCAL_SYNC_SERVER = 'http://localhost:8090';
export const SYNC_SERVER_KEY = 'NUCLIA_SYNC_SERVER';
export const SYNC_SERVER_TYPE_KEY = 'NUCLIA_SYNC_SERVER_TYPE';

@Injectable({ providedIn: 'root' })
export class SyncService {
  connectors: {
    [id: string]: {
      definition: ConnectorDefinition;
      instances?: { [key: string]: IConnector };
    };
  } = {
    gdrive: {
      definition: {
        id: 'gdrive',
        oauth_provider: 'google_oauth',
        title: 'Google Drive',
        logo: `${baseLogoPath}/gdrive.svg`,
        description: 'File storage and synchronization service developed by Google',
        permanentSyncOnly: true,
        cloud: true,
        factory: (settings) => new OAuthConnector('gdrive', settings?.['id'] || '', this.config.getOAuthServer()),
      },
    },
    onedrive: {
      definition: {
        id: 'onedrive',
        title: 'One Drive',
        logo: `${baseLogoPath}/onedrive.svg`,
        description: 'Microsoft OneDrive file hosting service',
        permanentSyncOnly: true,
        deprecated: true,
        factory: (settings) => new OAuthConnector('onedrive', settings?.['id'] || '', this.config.getOAuthServer()),
      },
    },
    sharepoint: {
      definition: {
        id: 'sharepoint',
        oauth_provider: 'azure_oauth',
        apikey_provider: 'azure_certificate_credentials',
        title: 'SharePoint',
        logo: `${baseLogoPath}/sharepoint.svg`,
        description: 'Microsoft Sharepoint service',
        permanentSyncOnly: true,
        cloud: true,
        factory: (settings) => new SharepointImpl(settings?.['id'] || '', this.config.getOAuthServer()),
      },
    },
    dropbox: {
      definition: {
        id: 'dropbox',
        title: 'Dropbox',
        logo: `${baseLogoPath}/dropbox.svg`,
        description: 'File storage and synchronization service developed by Dropbox',
        permanentSyncOnly: true,
        deprecated: true,
        factory: (settings) => new OAuthConnector('dropbox', settings?.['id'] || '', this.config.getOAuthServer()),
      },
    },
    folder: { definition: FolderConnector },
    sitemap: { definition: SitemapConnector },
    confluence: { definition: ConfluenceConnector },
    rss: { definition: RSSConnector },
    sitefinity: { definition: SitefinityConnector },
  };

  connectorsObs = new BehaviorSubject(
    Object.values(this.connectors)
      .map((obj) => obj.definition)
      .filter((def) => !def.deprecated),
  ).pipe(
    switchMap((connectors) =>
      this.features.unstable.sitefinityConnector.pipe(
        map((hasSitefinityConnector) =>
          connectors.filter((connector) => hasSitefinityConnector || connector.id !== 'sitefinity'),
        ),
      ),
    ),
  );
  private _syncServer = new BehaviorSubject<{ serverUrl: string; type: SyncServerType }>({
    serverUrl: localStorage.getItem(SYNC_SERVER_KEY) || LOCAL_SYNC_SERVER,
    type: (localStorage.getItem(SYNC_SERVER_TYPE_KEY) as SyncServerType) || 'desktop',
  });
  syncServer = this._syncServer.asObservable();

  private _isServerDown = new BehaviorSubject<boolean>(true);
  private _currentSyncId = new BehaviorSubject<string | null>(null);
  private _syncCache = new BehaviorSubject<{ [id: string]: ISyncEntity }>({});
  private _cacheUpdated = new BehaviorSubject<string>(new Date().toISOString());
  private _isSyncing = new BehaviorSubject<{ [id: string]: boolean }>({});

  isServerDown = this._isServerDown.asObservable();
  currentSyncId = this._currentSyncId.asObservable();
  serverHeaders = {
    token: this.sdk.nuclia.auth.getToken(true),
  };
  cacheUpdated = this._cacheUpdated.asObservable();
  isSyncing = this._isSyncing.asObservable();
  private _useCloudSync = new BehaviorSubject<boolean>(false);
  useCloudSync = this._useCloudSync.asObservable();

  constructor(
    private sdk: SDKService,
    private http: HttpClient,
    private config: BackendConfigurationService,
    private notificationService: NotificationService,
    private features: FeaturesService,
  ) {
    forkJoin([this.syncServer.pipe(take(1)), this.features.unstable.cloudSyncService.pipe(take(1))]).subscribe(
      ([server, enabled]) => {
        if (server.type === 'cloud' && enabled) {
          this._useCloudSync.next(true);
        }
      },
    );
  }

  getConnectorDefinition(connectorId: string): ConnectorDefinition {
    return this.connectors[connectorId]?.definition;
  }

  getConnector(connector: string, instance: string): IConnector {
    const source = this.connectors[connector];
    if (!source.instances) {
      source.instances = {};
    }
    const instances = source.instances as { [key: string]: IConnector };
    if (!instances[instance]) {
      instances[instance] = source.definition.factory({ id: instance });
    }
    return instances[instance];
  }

  getConnectorIdForProvider(provider: string): string | undefined {
    return Object.entries(this.connectors).find(
      ([, data]) => data.definition.oauth_provider === provider || data.definition.apikey_provider === provider,
    )?.[0];
  }

  getCurrentSync(): Observable<ISyncEntity> {
    return this.currentSyncId.pipe(
      filter((id) => !!id),
      switchMap((id) => this.getSync(id!)),
    );
  }

  private syncConfigtoISyncEntity(config: SyncConfiguration): ISyncEntity {
    return {
      id: config.id,
      title: config.name,
      connector: {
        name: config.external_connection.provider,
        parameters: config,
      },
      lastSyncGMT: undefined,
      disabled: false,
      isCloud: true,
    };
  }
  getSync(syncId: string): Observable<ISyncEntity> {
    const syncs = this._syncCache.getValue();
    if (syncs[syncId]) {
      return of(syncs[syncId]);
    } else {
      if (this._useCloudSync.getValue()) {
        return this.sdk.currentKb.pipe(
          take(1),
          switchMap((kb) => kb.syncManager.getConfig(syncId)),
          map((config) => ({
            ...this.syncConfigtoISyncEntity(config),
            kbId: config.kb_id,
            connectorId: this.getConnectorIdForProvider(config.external_connection.provider),
          })),
        );
      } else {
        return this.http
          .get<ISyncEntity>(`${this._syncServer.getValue().serverUrl}/sync/${syncId}`, {
            headers: this.serverHeaders,
          })
          .pipe(
            tap((sync) => {
              syncs[syncId] = sync;
              this._syncCache.next(syncs);
            }),
          );
      }
    }
  }

  addSync(sync: ISyncEntity): Observable<void> {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => {
        if (this.sdk.nuclia.options.standalone) {
          return of({
            ...sync,
            kb: { ...this.sdk.nuclia.options, knowledgeBox: kb.id },
          });
        } else {
          return this.getNucliaKey(kb).pipe(
            map((data) => ({
              ...sync,
              kb: {
                zone: this.sdk.nuclia.options.zone,
                backend: this.sdk.nuclia.options.backend,
                knowledgeBox: data.kbid,
                apiKey: data.token,
              } as NucliaOptions,
            })),
          );
        }
      }),
      switchMap((sync) =>
        this.http.post<void>(`${this._syncServer.getValue().serverUrl}/sync`, sync, {
          headers: this.serverHeaders,
        }),
      ),
      tap(() => {
        const syncs = this._syncCache.getValue();
        syncs[sync.id] = sync;
        this._syncCache.next(syncs);
        this._cacheUpdated.next(new Date().toISOString());
      }),
      map(() => {}),
    );
  }

  getOAuthUrl(provider: string): Observable<string> {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.syncManager.createOAuthExternalConnection(provider)),
      map((res) => res.authorize_url),
    );
  }

  addExternalConnection(provider: string, credentials: ExternalConnectionCredentials): Observable<ExternalConnection> {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.syncManager.createExternalConnection(provider, credentials)),
    );
  }

  addCloudSync(config: SyncConfigurationCreate): Observable<SyncConfiguration> {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.syncManager.createConfig(config)),
      tap((sync) => {
        const syncs = this._syncCache.getValue();
        syncs[sync.id] = this.syncConfigtoISyncEntity(sync);
        this._syncCache.next(syncs);
        this._cacheUpdated.next(new Date().toISOString());
      }),
    );
  }

  updateSync(syncId: string, sync: Partial<ISyncEntity>, resetLastSync?: boolean): Observable<void> {
    return this.http
      .patch<void>(
        `${this._syncServer.getValue().serverUrl}/sync/${syncId}`,
        { ...sync, lastSyncGMT: resetLastSync ? '1970-01-01' : undefined },
        {
          headers: this.serverHeaders,
        },
      )
      .pipe(
        tap(() => {
          const syncs = this._syncCache.getValue();
          syncs[syncId] = { ...syncs[syncId], ...sync };
          this._syncCache.next(syncs);
          this._cacheUpdated.next(new Date().toISOString());
        }),
      );
  }

  deleteSync(syncId: string): Observable<void> {
    return (
      this._useCloudSync.getValue()
        ? this.sdk.currentKb.pipe(
            take(1),
            switchMap((kb) => kb.syncManager.deleteConfig(syncId)),
          )
        : this.http.delete<void>(`${this._syncServer.getValue().serverUrl}/sync/${syncId}`, {
            headers: this.serverHeaders,
          })
    ).pipe(
      tap(() => {
        const syncs = this._syncCache.getValue();
        delete syncs[syncId];
        this._syncCache.next(syncs);
        this._cacheUpdated.next(new Date().toISOString());
      }),
    );
  }

  getSyncsForKB(kbId: string, useCloud: boolean): Observable<SyncBasicData[]> {
    if (useCloud) {
      return this.sdk.currentKb.pipe(
        take(1),
        switchMap((kb) =>
          kb.syncManager.getConfigs().pipe(
            map((configs) =>
              configs
                .filter((config) => config.kb_id === kbId)
                .map((config) => {
                  const connectorId = this.getConnectorIdForProvider(config.external_connection.provider);
                  return {
                    id: config.id,
                    kbId: config.kb_id,
                    title: config.name,
                    connectorId,
                    connector: connectorId ? this.getConnector(connectorId, config.id) : undefined,
                    lastSyncGMT: undefined,
                    disabled: false,
                  };
                }),
            ),
          ),
        ),
      );
    } else {
      return this.isServerDown.pipe(
        switchMap((isDown) =>
          isDown
            ? of([])
            : this.http
                .get<
                  {
                    id: string;
                    title: string;
                    connector: string;
                  }[]
                >(`${this._syncServer.getValue().serverUrl}/sync/kb/${kbId}`)
                .pipe(
                  map((syncs) =>
                    syncs
                      .map((sync) => ({
                        ...sync,
                        kbId,
                        connectorId: sync.connector,
                        connector: this.getConnector(sync.connector, ''),
                      }))
                      .filter((sync) => sync.kbId === kbId),
                  ),
                ),
        ),
      );
    }
  }

  getFiles(query?: string): Observable<SearchResults> {
    return this.http.get<SearchResults>(
      `${this._syncServer.getValue().serverUrl}/sync/${this.getCurrentSyncId()}/files/search${
        query ? `?query=${query}` : ''
      }`,
    );
  }

  // TODO: support query
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getFolders(query?: string): Observable<SearchResults> {
    return this.http.get<SearchResults>(
      `${this._syncServer.getValue().serverUrl}/sync/${this.getCurrentSyncId()}/folders`,
      {
        headers: this.serverHeaders,
      },
    );
  }

  canSelectFiles(syncId: string) {
    const sync = this._syncCache.getValue()[syncId];
    return (
      sync && !(sync.connector.name === 'sitemap' || sync.connector.name === 'folder' || sync.connector.name === 'rss')
    );
  }

  getNucliaKey(kb: WritableKnowledgeBox): Observable<{ token: string; kbid: string }> {
    return kb
      .createKeyForService(
        {
          title: 'Sync',
          role: 'SCONTRIBUTOR',
        },
        this.getExpirationDate(),
      )
      .pipe(map((token) => ({ ...token, kbid: kb.id })));
  }

  private getExpirationDate(): string {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return Math.floor(date.getTime() / 1000).toString();
  }

  serverStatus(server: string): Observable<{ running: boolean }> {
    return this.useCloudSync.pipe(
      switchMap((useCloud) =>
        useCloud
          ? of({ running: true })
          : this.http.get<{ running: boolean; logs?: string[] }>(`${server}/status`).pipe(
              catchError(() => of({ running: false, logs: ['Server down'] })),
              map((res) => {
                (res.logs || []).forEach((log) => console.log('[SERVER]', log));
                return { running: res.running };
              }),
            ),
      ),
    );
  }

  setSyncServer(serverUrl: string, type: 'desktop' | 'server' | 'cloud') {
    localStorage.setItem(SYNC_SERVER_KEY, serverUrl || '');
    localStorage.setItem(SYNC_SERVER_TYPE_KEY, type);
    this._syncServer.next({ serverUrl: serverUrl || '', type });
    if (serverUrl) {
      this.serverStatus(serverUrl).subscribe((status) => {
        this.setServerStatus(!status.running);
      });
    }
  }

  getCurrentSyncId(): string | null {
    return this._currentSyncId.getValue();
  }

  setCurrentSyncId(id: string) {
    this._currentSyncId.next(id);
  }

  clearCurrentSourceId() {
    this._currentSyncId.next(null);
  }

  getLogs(sync?: string, since?: string): Observable<LogEntity[]> {
    return this.http
      .get<LogEntity[]>(
        `${this._syncServer.getValue().serverUrl}/logs${sync ? '/' + sync : ''}${since ? '/' + since : ''}`,
      )
      .pipe(
        map((logs) =>
          logs.sort((a, b) => {
            const dateComparison = compareDesc(a.createdAt, b.createdAt);
            // Make sure logs about start are always displayed before logs about finished
            if (dateComparison === 0) {
              return a.action.startsWith('start') ? 1 : -1;
            } else {
              return dateComparison;
            }
          }),
        ),
      );
  }

  clearLogs(): Observable<void> {
    return this.http.delete<void>(`${this._syncServer.getValue().serverUrl}/logs`);
  }

  getSyncServer() {
    return this._syncServer.getValue().serverUrl;
  }

  setServerStatus(isDown: boolean) {
    if (isDown && !this._isServerDown.value) {
      this.notificationService.pushNotifications([
        {
          type: 'sync-server',
          data: [],
          timestamp: new Date().toISOString(),
          unread: true,
          failure: true,
        },
      ]);
    }
    this._isServerDown.next(isDown);
  }

  triggerSync(syncId: string, resyncAll = false): Observable<void> {
    this._isSyncing.next({ ...this._isSyncing.value, [syncId]: true });
    const resync = resyncAll ? this.updateSync(syncId, {}, true).pipe(map(() => true)) : of(true);
    return resync.pipe(
      switchMap(() => this.http.get<void>(`${this._syncServer.getValue().serverUrl}/sync/execute/${syncId}`)),
      tap(() => this._isSyncing.next({ ...this._isSyncing.value, [syncId]: false })),
      catchError((error) => {
        console.warn(`Trigger sync failed:`, error);
        this._isSyncing.next({ ...this._isSyncing.value, [syncId]: false });
        return of();
      }),
    );
  }

  updateUseCloudSync(use: boolean) {
    this._useCloudSync.next(use);
  }
}
