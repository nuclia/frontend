import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  filter,
  forkJoin,
  map,
  Observable,
  of,
  ReplaySubject,
  switchMap,
  take,
  tap,
} from 'rxjs';
import {
  baseLogoPath,
  ConnectorDefinition,
  IConnector,
  ISyncEntity,
  LogEntity,
  SearchResults,
  SyncBasicData,
} from './models';
import { BackendConfigurationService, NotificationService, SDKService } from '@flaps/core';
import { SitemapConnector } from './connectors/sitemap';
import { NucliaOptions, WritableKnowledgeBox } from '@nuclia/core';
import { HttpClient } from '@angular/common/http';
import { FolderConnector } from './connectors/folder';
import { SharepointImpl } from './connectors/sharepoint';
import { ConfluenceConnector } from './connectors/confluence';
import { RSSConnector } from './connectors/rss';
import { OAuthConnector } from './connectors/oauth';
import { compareDesc } from 'date-fns';

export type SyncServerType = 'desktop' | 'server';
export const LOCAL_SYNC_SERVER = 'http://localhost:8090';
export const SYNC_SERVER_KEY = 'NUCLIA_SYNC_SERVER';
export const SYNC_SERVER_TYPE_KEY = 'NUCLIA_SYNC_SERVER_TYPE';

@Injectable({ providedIn: 'root' })
export class SyncService {
  connectors: {
    [id: string]: {
      definition: ConnectorDefinition;
      instances?: { [key: string]: ReplaySubject<IConnector> };
    };
  } = {
    gdrive: {
      definition: {
        id: 'gdrive',
        title: 'Google Drive',
        logo: `${baseLogoPath}/gdrive.svg`,
        description: 'File storage and synchronization service developed by Google',
        permanentSyncOnly: true,
        factory: (settings) => of(new OAuthConnector('gdrive', settings?.['id'] || '', this.config.getOAuthServer())),
      },
    },
    onedrive: {
      definition: {
        id: 'onedrive',
        title: 'One Drive',
        logo: `${baseLogoPath}/onedrive.svg`,
        description: 'Microsoft OneDrive file hosting service',
        permanentSyncOnly: true,
        factory: (settings) => of(new OAuthConnector('onedrive', settings?.['id'] || '', this.config.getOAuthServer())),
      },
    },
    sharepoint: {
      definition: {
        id: 'sharepoint',
        title: 'SharePoint',
        logo: `${baseLogoPath}/sharepoint.svg`,
        description: 'Microsoft Sharepoint service',
        permanentSyncOnly: true,
        factory: (settings) =>
          of(new SharepointImpl('sharepoint', settings?.['id'] || '', this.config.getOAuthServer())),
      },
    },
    dropbox: {
      definition: {
        id: 'dropbox',
        title: 'Dropbox',
        logo: `${baseLogoPath}/dropbox.svg`,
        description: 'File storage and synchronization service developed by Dropbox',
        permanentSyncOnly: true,
        factory: (settings) => of(new OAuthConnector('dropbox', settings?.['id'] || '', this.config.getOAuthServer())),
      },
    },
    folder: { definition: FolderConnector },
    sitemap: { definition: SitemapConnector },
    confluence: { definition: ConfluenceConnector },
    rss: { definition: RSSConnector },
  };

  connectorsObs = new BehaviorSubject(Object.values(this.connectors).map((obj) => obj.definition));
  private _syncServer = new BehaviorSubject<{ serverUrl: string; type: SyncServerType }>({
    serverUrl: localStorage.getItem(SYNC_SERVER_KEY) || LOCAL_SYNC_SERVER,
    type: (localStorage.getItem(SYNC_SERVER_TYPE_KEY) as SyncServerType) || 'desktop',
  });
  syncServer = this._syncServer.asObservable();

  private _isServerDown = new BehaviorSubject<boolean>(true);
  private _currentSyncId = new BehaviorSubject<string | null>(null);
  private _syncCache = new BehaviorSubject<{ [id: string]: ISyncEntity }>({});
  private _syncListCache = new BehaviorSubject<SyncBasicData[]>([]);
  private _cacheUpdated = new BehaviorSubject<string>(new Date().toISOString());

  isServerDown = this._isServerDown.asObservable();
  currentSyncId = this._currentSyncId.asObservable();
  syncCache = this._syncCache.asObservable();
  syncListCache = this._syncListCache.asObservable();
  serverHeaders = {
    token: this.sdk.nuclia.auth.getToken(true),
  };
  cacheUpdated = this._cacheUpdated.asObservable();

  constructor(
    private sdk: SDKService,
    private http: HttpClient,
    private config: BackendConfigurationService,
    private notificationService: NotificationService,
  ) {}

  getConnectorDefinition(connectorId: string): ConnectorDefinition {
    return this.connectors[connectorId]?.definition;
  }

  getConnector(connector: string, instance: string): Observable<IConnector> {
    const source = this.connectors[connector];
    if (!source.instances) {
      source.instances = {};
    }
    const instances = source.instances as { [key: string]: ReplaySubject<IConnector> };
    if (!instances[instance]) {
      instances[instance] = new ReplaySubject(1);
      source.definition.factory({ id: instance }).subscribe(instances[instance] as ReplaySubject<IConnector>);
    }
    return (instances[instance] as ReplaySubject<IConnector>).asObservable();
  }

  getCurrentSync(): Observable<ISyncEntity> {
    return this.currentSyncId.pipe(
      filter((id) => !!id),
      switchMap((id) => this.getSync(id!)),
    );
  }

  getSync(syncId: string): Observable<ISyncEntity> {
    const syncs = this._syncCache.getValue();
    if (syncs[syncId]) {
      return of(syncs[syncId]);
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
      switchMap(() => this.getConnectors()),
      tap((connectors) => {
        const syncs = this._syncCache.getValue();
        syncs[sync.id] = sync;
        this._syncCache.next(syncs);
        const syncsList = this._syncListCache.getValue();
        this._syncListCache.next([
          ...syncsList,
          {
            id: sync.id,
            title: sync.title,
            connectorId: sync.connector.name,
            connector: connectors[sync.connector.name],
            kbId: sync.kb?.knowledgeBox || '',
            totalSyncedResources: 0,
            disabled: false,
          },
        ]);
        this._cacheUpdated.next(new Date().toISOString());
      }),
      map(() => {}),
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
          const syncsList = this._syncListCache.getValue();
          this._syncListCache.next(
            syncsList.map((item) =>
              item.id === syncId
                ? {
                    ...item,
                    title: sync.title || item.title,
                    disabled: typeof sync.disabled === 'boolean' ? sync.disabled : item.disabled,
                  }
                : item,
            ),
          );
          this._cacheUpdated.next(new Date().toISOString());
        }),
      );
  }

  deleteSync(syncId: string): Observable<void> {
    return this.http
      .delete<void>(`${this._syncServer.getValue().serverUrl}/sync/${syncId}`, {
        headers: this.serverHeaders,
      })
      .pipe(
        tap(() => {
          const syncs = this._syncCache.getValue();
          delete syncs[syncId];
          this._syncCache.next(syncs);
          const syncsList = this._syncListCache.getValue();
          this._syncListCache.next(syncsList.filter((sync) => sync.id !== syncId));
          this._cacheUpdated.next(new Date().toISOString());
        }),
      );
  }

  hasCurrentSourceAuth(): Observable<boolean> {
    const current = this.getCurrentSyncId();
    if (!current) {
      return of(false);
    } else {
      return this.http
        .get<{ hasAuth: boolean }>(`${this._syncServer.getValue().serverUrl}/sync/${this.getCurrentSyncId()}/auth`)
        .pipe(map((res) => res.hasAuth));
    }
  }

  getSyncsForKB(kbId: string): Observable<SyncBasicData[]> {
    const syncs = this._syncListCache.getValue();
    if (!syncs.find((sync) => sync.kbId === kbId)) {
      this.isServerDown
        .pipe(
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
                    switchMap((data) => this.getConnectors().pipe(map((connectors) => ({ data, connectors })))),
                    tap(({ data, connectors }) => {
                      this._syncListCache.next([
                        ...syncs,
                        ...data.map((sync) => ({
                          ...sync,
                          kbId,
                          connectorId: sync.connector,
                          connector: connectors[sync.connector],
                        })),
                      ]);
                    }),
                  ),
          ),
        )
        .subscribe();
    }
    return this._syncListCache.pipe(map((syncs) => syncs.filter((sync) => sync.kbId === kbId)));
  }

  getFiles(query?: string): Observable<SearchResults> {
    return this.http.get<SearchResults>(
      `${this._syncServer.getValue().serverUrl}/sync/${this.getCurrentSyncId()}/files/search${
        query ? `?query=${query}` : ''
      }`,
    );
  }

  // FIXME: support query
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
    return this.http.get<{ running: boolean; logs?: string[] }>(`${server}/status`).pipe(
      catchError(() => of({ running: false, logs: ['Server down'] })),
      map((res) => {
        (res.logs || []).forEach((log) => console.log('[SERVER]', log));
        return { running: res.running };
      }),
    );
  }

  setSyncServer(serverUrl: string, type: 'desktop' | 'server') {
    localStorage.setItem(SYNC_SERVER_KEY, serverUrl || '');
    localStorage.setItem(SYNC_SERVER_TYPE_KEY, type);
    this._syncServer.next({ serverUrl: serverUrl || '', type });
    if (serverUrl) {
      this.serverStatus(serverUrl).subscribe((status) => {
        this.setServerStatus(!status.running);
      });
    }
  }

  authenticateToConnector(connectorId: string, connector: IConnector): Observable<boolean> {
    return connector.authenticate().pipe(
      filter((authenticated) => authenticated),
      take(1),
      switchMap(() =>
        this.updateSync(this.getCurrentSyncId() || '', {
          connector: { name: connectorId, parameters: connector.getParametersValues() },
        }),
      ),
      map(() => {
        connector.cleanAuthData();
        return true;
      }),
    );
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

  triggerSyncs(): Observable<void> {
    return this.http.get<void>(`${this._syncServer.getValue().serverUrl}/sync/execute`);
  }

  private getConnectors(): Observable<{ [id: string]: IConnector }> {
    return forkJoin(
      Object.keys(this.connectors).map((connectorId) =>
        this.getConnector(connectorId, '').pipe(map((connector) => ({ connector, connectorId }))),
      ),
    ).pipe(
      map((data) =>
        data.reduce(
          (connectors, { connectorId, connector }) => {
            connectors[connectorId] = connector;
            return connectors;
          },
          {} as { [id: string]: IConnector },
        ),
      ),
    );
  }
}
