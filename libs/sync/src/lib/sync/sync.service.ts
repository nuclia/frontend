import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  distinctUntilChanged,
  filter,
  forkJoin,
  from,
  map,
  Observable,
  of,
  ReplaySubject,
  Subject,
  switchMap,
  take,
  tap,
} from 'rxjs';
import {
  baseLogoPath,
  ConnectorSettings,
  DestinationConnectorDefinition,
  IDestinationConnector,
  ISourceConnector,
  SearchResults,
  Source,
  SourceConnectorDefinition,
  SyncItem,
  SyncRow,
} from './models';
import { NucliaCloudKB } from './destinations/nuclia-cloud';
import { BackendConfigurationService, injectScript, SDKService } from '@flaps/core';
import { SitemapConnector } from './sources/sitemap';
import { Classification, NucliaOptions, WritableKnowledgeBox } from '@nuclia/core';
import { HttpClient } from '@angular/common/http';
import { FolderConnector } from './sources/folder';
import { SharepointImpl } from './sources/sharepoint';
import { ConfluenceConnector } from './sources/confluence';
import { OAuthConnector } from './sources/oauth';
import { ISyncEntity, SyncBasicData } from './new-models';

export const ACCOUNT_KEY = 'NUCLIA_ACCOUNT';
export const ACCOUNT_ID_KEY = 'NUCLIA_ID_ACCOUNT';
export const LOCAL_SYNC_SERVER = 'http://localhost:5001';
export const SYNC_SERVER_KEY = 'NUCLIA_SYNC_SERVER';

@Injectable({ providedIn: 'root' })
export class SyncService {
  sources: {
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
        factory: (settings) => of(new OAuthConnector('gdrive', settings?.['id'] || '', this.config.getAPIOrigin())),
      },
      settings: {},
    },
    onedrive: {
      definition: {
        id: 'onedrive',
        title: 'One Drive',
        logo: `${baseLogoPath}/onedrive.svg`,
        description: 'Microsoft OneDrive file hosting service',
        factory: (settings) => of(new OAuthConnector('onedrive', settings?.['id'] || '', this.config.getAPIOrigin())),
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
        factory: (settings) => of(new SharepointImpl('sharepoint', settings?.['id'] || '', this.config.getAPIOrigin())),
      },
      settings: {},
    },
    dropbox: {
      definition: {
        id: 'dropbox',
        title: 'Dropbox',
        logo: `${baseLogoPath}/dropbox.svg`,
        description: 'File storage and synchronization service developed by Dropbox',
        factory: (settings) => of(new OAuthConnector('dropbox', settings?.['id'] || '', this.config.getAPIOrigin())),
      },
      settings: {},
    },
    folder: { definition: FolderConnector, settings: {} },
    sitemap: { definition: SitemapConnector, settings: {} },
    confluence: { definition: ConfluenceConnector, settings: {} },
    // s3: { definition: S3Connector, settings: {} },
    // gcs: { definition: GCSConnector, settings: {} },
    // brightcove: { definition: BrightcoveConnector, settings: {} },
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
  sourceObs = new BehaviorSubject(Object.values(this.sources).map((obj) => obj.definition));
  private _syncServer = new BehaviorSubject<string>(localStorage.getItem(SYNC_SERVER_KEY) || '');
  syncServer = this._syncServer.asObservable();

  private _step = new BehaviorSubject<number>(-1);
  step = this._step.asObservable();
  showSource = new Subject<{ connectorId: string; sourceId: string }>();
  addSource = new Subject<void>();
  private _isServerDown = new BehaviorSubject<boolean>(true);
  isServerDown = this._isServerDown.asObservable();
  private _currentSourceId = new BehaviorSubject<string | null>(null);
  currentSourceId = this._currentSourceId.asObservable();
  private _sourcesCache = new BehaviorSubject<{ [id: string]: Source }>({});
  sourcesCache = this._sourcesCache.asObservable();
  currentSource = combineLatest([this.sourcesCache, this.currentSourceId]).pipe(
    map(([sources, sourceId]) => sources[sourceId || '']),
  );
  private _basePath = new BehaviorSubject<string>('/');
  basePath = this._basePath.asObservable();

  constructor(
    private sdk: SDKService,
    private http: HttpClient,
    private config: BackendConfigurationService,
  ) {
    const account = this.getAccountId();
    if (account) {
      this.setAccount();
    }

    this.isServerDown
      .pipe(
        distinctUntilChanged(),
        filter((isDown) => !isDown),
        switchMap(() => this.getSources()),
      )
      .subscribe(this._sourcesCache);

    // use local server by default and start it automatically when we start the app
    if (!localStorage.getItem(SYNC_SERVER_KEY) || localStorage.getItem(SYNC_SERVER_KEY) === LOCAL_SYNC_SERVER) {
      this.setSyncServer({ url: '', local: true });
    }
  }

  getSource(connector: string, instance: string): Observable<ISourceConnector> {
    const source = this.sources[connector];
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
    return this.destinations[id].definition.factory({ ...this.destinations[id].settings, ...settings });
  }

  setSourceAndDestination(
    sourceId: string,
    source: Source,
    kbId: string,
    localBackend?: string,
    labels?: Classification[],
  ): Observable<void> {
    if (localBackend) {
      source = {
        ...source,
        labels,
        kb: { standalone: true, zone: '', backend: localBackend, account: 'local', knowledgeBox: kbId },
      };
      return this.setSourceData(sourceId, source);
    } else {
      return this.getKb(kbId).pipe(
        switchMap((kb) => {
          if (source.kb && source.kb.knowledgeBox === kb.id && source.kb.apiKey) {
            return of(source);
          } else {
            return this.getNucliaKey(kb).pipe(
              map((data) => ({
                ...source,
                labels,
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
        switchMap((source) => this.setSourceData(sourceId, source)),
      );
    }
  }

  setSourceData(sourceId: string, source: Source, resetLastSync?: boolean): Observable<void> {
    return this.http.post<void>(`${this._syncServer.getValue()}/source`, { [sourceId]: source }).pipe(
      tap(() => {
        const existing = this._sourcesCache.getValue()[sourceId];
        const value = existing ? { ...existing, ...source } : source;
        this._sourcesCache.next({ ...this._sourcesCache.getValue(), [sourceId]: value });
      }),
    );
  }

  getSourceData(sourceId: string): Observable<Source> {
    return this.http.get<Source>(`${this._syncServer.getValue()}/source/${sourceId}`);
  }

  deleteSource(sourceId: string): Observable<void> {
    return this.http.delete<void>(`${this._syncServer.getValue()}/source/${sourceId}`).pipe(
      tap(() => {
        const sources = this._sourcesCache.getValue();
        delete sources[sourceId];
        this._sourcesCache.next(sources);
      }),
    );
  }

  hasCurrentSourceAuth(): Observable<boolean> {
    const current = this.getCurrentSourceId();
    if (!current) {
      return of(false);
    } else {
      return this.http
        .get<{ hasAuth: boolean }>(`${this._syncServer.getValue()}/source/${this.getCurrentSourceId()}/auth`)
        .pipe(map((res) => res.hasAuth));
    }
  }

  getSources(): Observable<{ [id: string]: Source }> {
    return this.http.get<{ [id: string]: Source }>(`${this._syncServer.getValue()}/sources`);
  }

  getFiles(query?: string): Observable<SearchResults> {
    return this.http.get<SearchResults>(
      `${this._syncServer.getValue()}/source/${this.getCurrentSourceId()}/files/search${
        query ? `?query=${query}` : ''
      }`,
    );
  }

  getFolders(query?: string): Observable<SearchResults> {
    return this.http.get<SearchResults>(
      `${this._syncServer.getValue()}/source/${this.getCurrentSourceId()}/folders/search${
        query ? `?query=${query}` : ''
      }`,
    );
  }

  canSelectFiles(sourceId: string) {
    const source = this._sourcesCache.getValue()[sourceId];
    return source && !(source.connectorId === 'sitemap' || (source.connectorId === 'folder' && source.permanentSync));
  }

  getAccountSlug(): string {
    return localStorage.getItem(ACCOUNT_KEY) || '';
  }

  getAccountId(): string {
    return localStorage.getItem(ACCOUNT_ID_KEY) || '';
  }

  selectAccount(account: string, accountId: string) {
    localStorage.setItem(ACCOUNT_KEY, account);
    localStorage.setItem(ACCOUNT_ID_KEY, accountId);
    this.setAccount();
  }

  setAccount() {
    this.sdk
      .setCurrentAccount(this.getAccountId())
      .pipe(
        take(1),
        switchMap(() =>
          this.sdk.nuclia.db.getAccount(this.getAccountId()).pipe(
            tap((account) => {
              this.sdk.nuclia.options.accountType = account.type;
              this.sdk.nuclia.options.account = account.slug;
            }),
            switchMap((account) => this.sdk.nuclia.rest.getZoneSlug(account.zone)),
            tap((zone) => (this.sdk.nuclia.options.zone = zone)),
          ),
        ),
      )
      .subscribe();
  }

  setStep(step: number) {
    this._step.next(step);
  }

  getSourceCache(name: string): Source {
    return this._sourcesCache.getValue()[name];
  }

  getKb(kbId: string): Observable<WritableKnowledgeBox> {
    return this.sdk.currentAccount.pipe(
      take(1),
      switchMap((account) =>
        this.sdk.nuclia.db.getKnowledgeBoxes(account.slug, account.id).pipe(
          map((kbs) => kbs.find((kb) => kb.id === kbId)),
          switchMap((kb) => this.sdk.nuclia.db.getKnowledgeBox(account.id, kb?.id || '', kb?.zone)),
        ),
      ),
    );
  }

  getNucliaKey(kb: WritableKnowledgeBox): Observable<{ token: string; kbid: string }> {
    return kb
      .createKeyForService(
        {
          title: 'Desktop',
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
    return this.http.get<{ running: boolean; logs: string[] }>(`${server}/status`).pipe(
      catchError(() => of({ running: false, logs: ['Server down'] })),
      map((res) => {
        res.logs.forEach((log) => console.log('[SERVER]', log));
        return { running: res.running };
      }),
    );
  }

  setSyncServer(server: { url?: string; local?: boolean }) {
    if (server.local) {
      this._syncServer.next(LOCAL_SYNC_SERVER);
      localStorage.setItem(SYNC_SERVER_KEY, LOCAL_SYNC_SERVER);
      const electron = (window as any)['electron'];
      if (electron) {
        this.serverStatus(LOCAL_SYNC_SERVER)
          .pipe(take(1))
          .subscribe((res) => {
            if (!res.running) {
              electron.startLocalServer();
            }
          });
      }
    } else if (server.url) {
      localStorage.setItem(SYNC_SERVER_KEY, server.url);
      this._syncServer.next(server.url);
    }
  }

  resetSyncServer() {
    this._syncServer.next('');
  }

  authenticateToSource(source: ISourceConnector): Observable<boolean> {
    return source.authenticate().pipe(
      filter((authenticated) => authenticated),
      take(1),
      switchMap(() => {
        return this.currentSource.pipe(
          take(1),
          switchMap((currentSource) =>
            this.setSourceData(this.getCurrentSourceId() || '', {
              ...currentSource,
              data: source.getParametersValues(),
            }),
          ),
          map(() => true),
        );
      }),
    );
  }

  getCurrentSourceId(): string | null {
    return this._currentSourceId.getValue();
  }

  setCurrentSourceId(id: string) {
    this._currentSourceId.next(id);
  }

  clearCurrentSourceId() {
    this._currentSourceId.next(null);
  }

  getLogs(sync?: string, since?: string): Observable<SyncRow[]> {
    return this.http
      .get<SyncRow[]>(`${this._syncServer.getValue()}/logs${since ? '/' + since : ''}`)
      .pipe(map((logs) => logs.reverse()));
  }

  getActiveLogs(): Observable<SyncRow[]> {
    return this.http
      .get<{ [id: string]: SyncRow }>(`${this._syncServer.getValue()}/active-logs`)
      .pipe(map((logs) => Object.values(logs)));
  }

  clearLogs(): Observable<void> {
    return this.http.delete<void>(`${this._syncServer.getValue()}/logs`);
  }

  cleanUpAccount() {
    localStorage.removeItem(ACCOUNT_KEY);
    localStorage.removeItem(ACCOUNT_ID_KEY);
  }

  logout() {
    this.cleanUpAccount();
    this.sdk.nuclia.auth.logout();
  }

  setBasePath(path: string) {
    this._basePath.next(path);
  }

  getSyncServer() {
    return this._syncServer.getValue();
  }

  setServerStatus(isDown: boolean) {
    this._isServerDown.next(isDown);
  }

  // METHODS FOR THE NEW SERVICE
  syncListCache = new BehaviorSubject<SyncBasicData[]>([]).asObservable();
  hasSyncServer(): boolean {
    throw new Error('Method not implemented.');
  }
  getSyncsForKB(kbId: string): Observable<SyncBasicData[]> {
    throw new Error('Method not implemented.');
  }
  getCurrentSync(): Observable<ISyncEntity> {
    throw new Error('Method not implemented.');
  }
  triggerSyncs(): Observable<void> {
    throw new Error('Method not implemented.');
  }

  getSync(syncId: string): Observable<ISyncEntity> {
    throw new Error('Method not implemented.');
  }

  addSync(sync: ISyncEntity): Observable<void> {
    throw new Error('Method not implemented.');
  }

  updateSync(syncId: string, sync: Partial<ISyncEntity>, resetLastSync?: boolean): Observable<void> {
    throw new Error('Method not implemented.');
  }

  getConnector(connector: string, instance: string): Observable<ISourceConnector> {
    throw new Error('Method not implemented.');
  }

  deleteSync(syncId: string): Observable<void> {
    throw new Error('Method not implemented.');
  }

  authenticateToConnector(connectorId: string, connector: ISourceConnector): Observable<boolean> {
    throw new Error('Method not implemented.');
  }
}
