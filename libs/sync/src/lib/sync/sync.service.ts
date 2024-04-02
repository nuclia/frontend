import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import {
  BehaviorSubject,
  catchError,
  filter,
  interval,
  map,
  Observable,
  of,
  ReplaySubject,
  skip,
  switchMap,
  take,
  tap,
} from 'rxjs';
import {
  baseLogoPath,
  ConnectorSettings,
  IConnector,
  ISyncEntity,
  LogEntity,
  SearchResults,
  ConnectorDefinition,
  SyncBasicData,
} from './models';
import { BackendConfigurationService, NotificationService, SDKService } from '@flaps/core';
import { SitemapConnector } from './sources/sitemap';
import { NucliaOptions, WritableKnowledgeBox } from '@nuclia/core';
import { HttpClient } from '@angular/common/http';
import { FolderConnector } from './sources/folder';
import { SharepointImpl } from './sources/sharepoint';
import { ConfluenceConnector } from './sources/confluence';
import { RSSConnector } from './sources/rss';
import { OAuthConnector } from './sources/oauth';

export const LOCAL_SYNC_SERVER = 'http://localhost:8090';
export const SYNC_SERVER_KEY = 'NUCLIA_SYNC_SERVER';

@Injectable({ providedIn: 'root' })
export class SyncService {
  connectors: {
    [id: string]: {
      definition: ConnectorDefinition;
      settings: ConnectorSettings;
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
      settings: {},
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
      settings: {},
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
      settings: {},
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
      settings: {},
    },
    folder: { definition: FolderConnector, settings: {} },
    sitemap: { definition: SitemapConnector, settings: {} },
    confluence: { definition: ConfluenceConnector, settings: {} },
    rss: { definition: RSSConnector, settings: {} },
  };

  connectorsObs = new BehaviorSubject(Object.values(this.connectors).map((obj) => obj.definition));
  private _syncServer = new BehaviorSubject<string>(localStorage.getItem(SYNC_SERVER_KEY) || '');
  syncServer = this._syncServer.asObservable();

  private _isServerDown = new BehaviorSubject<boolean>(true);
  isServerDown = this._isServerDown.asObservable();
  private _currentSyncId = new BehaviorSubject<string | null>(null);
  currentSourceId = this._currentSyncId.asObservable();
  private _syncCache = new BehaviorSubject<{ [id: string]: ISyncEntity }>({});
  syncCache = this._syncCache.asObservable();
  private _syncListCache = new BehaviorSubject<SyncBasicData[]>([]);
  syncListCache = this._syncListCache.asObservable();
  serverHeaders = {
    token: this.sdk.nuclia.auth.getToken(true),
  };

  constructor(
    private sdk: SDKService,
    private http: HttpClient,
    private config: BackendConfigurationService,
    private notificationService: NotificationService,
    private location: Location,
  ) {
    if (this.hasSyncServer()) {
      this.initServer();
    }
  }

  initServer() {
    let isUp = false;
    interval(5000)
      .pipe(
        // do not pull when not in upload page
        filter(() => {
          const path = this.location.path();
          console.log('Path', path);
          return path.includes('/upload/') || path.endsWith('/upload');
        }),
        // Delay of 5min when the server is running, and 5s when the server is down
        skip(isUp ? 60 : 0),
        switchMap(() => this.serverStatus(this.getSyncServer())),
      )
      .subscribe((res) => {
        isUp = res.running;
        this.setServerStatus(!isUp);
      });
  }

  getConnector(connector: string, instance: string): Observable<IConnector> {
    const source = this.connectors[connector];
    if (!source.instances) {
      source.instances = {};
    }
    const instances = source.instances as { [key: string]: ReplaySubject<IConnector> };
    if (!instances[instance]) {
      instances[instance] = new ReplaySubject(1);
      source.definition
        .factory({ ...source.settings, id: instance })
        .subscribe(instances[instance] as ReplaySubject<IConnector>);
    }
    return (instances[instance] as ReplaySubject<IConnector>).asObservable();
  }

  getCurrentSync(): Observable<ISyncEntity> {
    return this.currentSourceId.pipe(
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
        .get<ISyncEntity>(`${this._syncServer.getValue()}/sync/${syncId}`, {
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
        this.http.post<void>(`${this._syncServer.getValue()}/sync`, sync, {
          headers: this.serverHeaders,
        }),
      ),
      tap(() => {
        const syncs = this._syncCache.getValue();
        syncs[sync.id] = sync;
        this._syncCache.next(syncs);
        const syncsList = this._syncListCache.getValue();
        this._syncListCache.next([
          ...syncsList,
          { id: sync.id, title: sync.title, connectorId: sync.connector.name, kbId: sync.kb?.knowledgeBox || '' },
        ]);
      }),
    );
  }

  updateSync(syncId: string, sync: Partial<ISyncEntity>, resetLastSync?: boolean): Observable<void> {
    return this.http
      .patch<void>(
        `${this._syncServer.getValue()}/sync/${syncId}`,
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
            syncsList.map((s) => (s.id === syncId ? { ...s, title: sync.title || s.title } : s)),
          );
          // next is used to trigger the update of the current sync title
          this._currentSyncId.next(syncId);
        }),
      );
  }

  deleteSync(syncId: string): Observable<void> {
    return this.http
      .delete<void>(`${this._syncServer.getValue()}/sync/${syncId}`, {
        headers: this.serverHeaders,
      })
      .pipe(
        tap(() => {
          const syncs = this._syncCache.getValue();
          delete syncs[syncId];
          this._syncCache.next(syncs);
          const syncsList = this._syncListCache.getValue();
          this._syncListCache.next(syncsList.filter((sync) => sync.id !== syncId));
        }),
      );
  }

  hasCurrentSourceAuth(): Observable<boolean> {
    const current = this.getCurrentSourceId();
    if (!current) {
      return of(false);
    } else {
      return this.http
        .get<{ hasAuth: boolean }>(`${this._syncServer.getValue()}/sync/${this.getCurrentSourceId()}/auth`)
        .pipe(map((res) => res.hasAuth));
    }
  }

  getSyncsForKB(kbId: string): Observable<SyncBasicData[]> {
    const syncs = this._syncListCache.getValue();
    if (!syncs.find((sync) => sync.kbId === kbId)) {
      this.http
        .get<
          {
            id: string;
            title: string;
            connector: string;
          }[]
        >(`${this._syncServer.getValue()}/sync/kb/${kbId}`)
        .subscribe((data) => {
          this._syncListCache.next([...syncs, ...data.map((sync) => ({ ...sync, kbId, connectorId: sync.connector }))]);
        });
    }
    return this._syncListCache.pipe(map((syncs) => syncs.filter((sync) => sync.kbId === kbId)));
  }

  getFiles(query?: string): Observable<SearchResults> {
    return this.http.get<SearchResults>(
      `${this._syncServer.getValue()}/sync/${this.getCurrentSourceId()}/files/search${query ? `?query=${query}` : ''}`,
    );
  }

  getFolders(query?: string): Observable<SearchResults> {
    return this.http.get<SearchResults>(`${this._syncServer.getValue()}/sync/${this.getCurrentSourceId()}/folders`, {
      headers: this.serverHeaders,
    });
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

  setSyncServer(server: string) {
    localStorage.setItem(SYNC_SERVER_KEY, server || '');
    this._syncServer.next(server || '');
    if (server) {
      this.serverStatus(server).subscribe((status) => {
        this.setServerStatus(!status.running);
      });
    }
  }

  hasSyncServer(): boolean {
    return !!localStorage.getItem(SYNC_SERVER_KEY);
  }

  resetSyncServer() {
    this._syncServer.next('');
  }

  authenticateToConnector(connectorId: string, connector: IConnector): Observable<boolean> {
    return connector.authenticate().pipe(
      filter((authenticated) => authenticated),
      take(1),
      switchMap(() =>
        this.updateSync(this.getCurrentSourceId() || '', {
          connector: { name: connectorId, parameters: connector.getParametersValues() },
        }),
      ),
      map(() => {
        connector.cleanAuthData();
        return true;
      }),
    );
  }

  getCurrentSourceId(): string | null {
    return this._currentSyncId.getValue();
  }

  setCurrentSourceId(id: string) {
    this._currentSyncId.next(id);
  }

  clearCurrentSourceId() {
    this._currentSyncId.next(null);
  }

  getLogs(sync?: string, since?: string): Observable<LogEntity[]> {
    return this.http
      .get<LogEntity[]>(`${this._syncServer.getValue()}/logs${sync ? '/' + sync : ''}${since ? '/' + since : ''}`)
      .pipe(map((logs) => logs.reverse()));
  }

  clearLogs(): Observable<void> {
    return this.http.delete<void>(`${this._syncServer.getValue()}/logs`);
  }

  getSyncServer() {
    return this._syncServer.getValue();
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
    return this.http.get<void>(`${this._syncServer.getValue()}/sync/execute`);
  }
}
