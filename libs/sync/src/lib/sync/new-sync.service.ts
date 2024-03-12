import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  filter,
  map,
  Observable,
  of,
  repeat,
  ReplaySubject,
  Subject,
  switchMap,
  take,
  tap,
  timer,
} from 'rxjs';
import {
  baseLogoPath,
  ConnectorSettings,
  DestinationConnectorDefinition,
  IDestinationConnector,
  ISourceConnector,
  ISyncEntity,
  LogEntity,
  SearchResults,
  Source,
  SourceConnectorDefinition,
  SyncBasicData,
  SyncRow,
} from './new-models';
import { NucliaCloudKB } from './destinations/nuclia-cloud';
import { BackendConfigurationService, NotificationService, SDKService } from '@flaps/core';
import { SitemapConnector } from './sources/sitemap';
import { Classification, NucliaOptions, WritableKnowledgeBox } from '@nuclia/core';
import { HttpClient } from '@angular/common/http';
import { FolderConnector } from './sources/folder';
import { SharepointImpl } from './sources/sharepoint';
import { ConfluenceConnector } from './sources/confluence';
import { OAuthConnector } from './sources/oauth';

export const LOCAL_SYNC_SERVER = 'http://localhost:8090';
export const SYNC_SERVER_KEY = 'NUCLIA_SYNC_SERVER';

@Injectable({ providedIn: 'root' })
export class NewSyncService {
  connectors: {
    [id: string]: {
      definition: SourceConnectorDefinition;
      settings: ConnectorSettings;
      instances?: { [key: string]: ReplaySubject<ISourceConnector> };
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
  };
  destinations: { [id: string]: { definition: DestinationConnectorDefinition; settings: ConnectorSettings } } = {
    nucliacloud: {
      definition: NucliaCloudKB,
      settings: {
        backend: this.config.getAPIURL(),
        client: this.config.staticConf.client,
      },
    },
  };
  sourceObs = new BehaviorSubject(Object.values(this.connectors).map((obj) => obj.definition)); // TO BE REMOVED (kept for compatibility with old code)
  private _syncServer = new BehaviorSubject<string>(localStorage.getItem(SYNC_SERVER_KEY) || '');
  syncServer = this._syncServer.asObservable();

  private _step = new BehaviorSubject<number>(-1);
  step = this._step.asObservable();
  showSource = new Subject<{ connectorId: string; sourceId: string }>();
  addSource = new Subject<void>();
  private _isServerDown = new BehaviorSubject<boolean>(true);
  isServerDown = this._isServerDown.asObservable();
  private _currentSyncId = new BehaviorSubject<string | null>(null);
  currentSourceId = this._currentSyncId.asObservable();
  private _syncCache = new BehaviorSubject<{ [id: string]: ISyncEntity }>({});
  syncCache = this._syncCache.asObservable();
  private _syncListCache = new BehaviorSubject<SyncBasicData[]>([]);
  syncListCache = this._syncListCache.asObservable();
  sourcesCache: Observable<{ [id: string]: Source }> = this.syncCache.pipe(
    map((syncs) =>
      Object.entries(syncs).reduce(
        (acc, [id, sync]) => ({
          ...acc,
          [id]: this.syncToSource(sync),
        }),
        {},
      ),
    ),
  );
  currentSource = combineLatest([this.sourcesCache, this.currentSourceId]).pipe(
    map(([sources, sourceId]) => sources[sourceId || '']),
  );
  serverHeaders = {
    token: this.sdk.nuclia.auth.getToken(true),
  };

  constructor(
    private sdk: SDKService,
    private http: HttpClient,
    private config: BackendConfigurationService,
    private notificationService: NotificationService,
  ) {
    if (this.hasSyncServer()) {
      this.initServer();
    }
  }

  initServer() {
    let delay = 5000;
    of(true)
      .pipe(
        switchMap(() => this.serverStatus(this.getSyncServer())),
        // Delay of 5min when the server is running, and 5s when the server is down
        tap((res) => (delay = res.running ? 5 * 60 * 1000 : 5000)),
        map((res) => !res.running),
        repeat({ delay: () => timer(delay) }),
      )
      .subscribe((isServerDown) => this.setServerStatus(isServerDown));
  }

  getSource(connector: string, instance: string): Observable<ISourceConnector> {
    throw new Error('Method not implemented.');
  }

  getConnector(connector: string, instance: string): Observable<ISourceConnector> {
    const source = this.connectors[connector];
    if (!source.instances) {
      source.instances = {};
    }
    const instances = source.instances as { [key: string]: ReplaySubject<ISourceConnector> };
    if (!instances[instance]) {
      instances[instance] = new ReplaySubject(1);
      source.definition
        .factory({ ...source.settings, id: instance })
        .subscribe(instances[instance] as ReplaySubject<ISourceConnector>);
    }
    return (instances[instance] as ReplaySubject<ISourceConnector>).asObservable();
  }

  getDestination(id: string, settings: ConnectorSettings = {}): Observable<IDestinationConnector> {
    throw new Error('Method not implemented.');
  }

  getCurrentSync(): Observable<ISyncEntity> {
    return this.currentSourceId.pipe(
      filter((id) => !!id),
      switchMap((id) => this.getSync(id!)),
    );
  }

  setSourceAndDestination(
    sourceId: string,
    source: Source,
    kbId: string, // TO BE REMOVED (useless, kept for compatibility with old code)
    localBackend?: string, // TO BE REMOVED (useless, kept for compatibility with old code)
    labels?: Classification[],
  ): Observable<void> {
    throw new Error('Method not implemented.');
  }

  setSourceData(sourceId: string, source: Partial<Source>, resetLastSync?: boolean): Observable<void> {
    throw new Error('Method not implemented.');
  }

  getSourceData(sourceId: string): Observable<Source> {
    throw new Error('Method not implemented.');
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

  deleteSource(sourceId: string): Observable<void> {
    throw new Error('Method not implemented.');
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

  getSources(): Observable<{ [id: string]: Source }> {
    throw new Error('Method not implemented.');
  }

  getSyncsForKB(kbId: string): Observable<SyncBasicData[]> {
    const syncs = this._syncListCache.getValue();
    if (!syncs.find((sync) => sync.kbId === kbId)) {
      this.http
        .get<
          {
            id: string;
            title: string;
            connectorId: string;
          }[]
        >(`${this._syncServer.getValue()}/sync/kb/${kbId}`)
        .subscribe((data) => {
          this._syncListCache.next([...syncs, ...data.map((sync) => ({ ...sync, kbId }))]);
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
    return sync && !(sync.connector.name === 'sitemap' || sync.connector.name === 'folder');
  }

  setStep(step: number) {
    this._step.next(step);
  }

  getSourceCache(name: string): Source {
    return this.syncToSource(this._syncCache.getValue()[name]);
  }

  getKb(kbId: string): Observable<WritableKnowledgeBox> {
    throw new Error('Method not implemented.');
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

  // "local" parameter can be removed once desktop is gone
  setSyncServer(server: { url?: string; local?: boolean }) {
    localStorage.setItem(SYNC_SERVER_KEY, server.url || '');
    this._syncServer.next(server.url || '');
    this.serverStatus(server.url || '').subscribe((status) => {
      this.setServerStatus(!status.running);
    });
  }

  hasSyncServer(): boolean {
    return !!localStorage.getItem(SYNC_SERVER_KEY);
  }

  resetSyncServer() {
    this._syncServer.next('');
  }

  authenticateToSource(source: ISourceConnector): Observable<boolean> {
    throw new Error('Method not implemented.');
  }

  authenticateToConnector(connectorId: string, connector: ISourceConnector): Observable<boolean> {
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

  getLogs(sync?: string, since?: string): Observable<SyncRow[]> {
    return this.http
      .get<LogEntity[]>(`${this._syncServer.getValue()}/logs${sync ? '/' + sync : ''}${since ? '/' + since : ''}`)
      .pipe(
        map((logs) =>
          logs.reverse().map(
            (log) =>
              ({
                date: log.createdAt,
                from: log.payload?.['title'],
                to: log.payload?.['kb']?.['knowledgeBox'],
                total: 1,
                progress: 1,
                started: true,
                completed: true,
                level: log.level,
                errors: log.message, // we use the message field to store the error, but when dropping desktop, we will not use this mapping anymore
              }) as SyncRow,
          ),
        ),
      );
  }

  getActiveLogs(): Observable<SyncRow[]> {
    // to be removed when desktop is gone
    return of([]);
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

  private syncToSource(sync: ISyncEntity): Source {
    return {
      connectorId: sync.connector.name,
      title: sync.title,
      data: sync.connector.parameters,
      kb: sync.kb || this.sdk.nuclia.options,
      items: sync.foldersToSync,
      permanentSync: true,
      labels: sync.labels,
      filters: sync.filters,
      lastSync: sync.lastSyncGMT,
    };
  }

  private sourceToSync(sourceId: string, source: Source): ISyncEntity {
    return {
      id: sourceId,
      connector: { name: source.connectorId, parameters: source.data },
      kb: source.kb,
      labels: source.labels,
      title: source.title || sourceId,
      foldersToSync: source.items,
      filters: source.filters,
      lastSyncGMT: source.lastSync,
    };
  }
}
