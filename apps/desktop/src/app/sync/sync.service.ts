import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  distinctUntilChanged,
  filter,
  forkJoin,
  from,
  map,
  Observable,
  of,
  repeat,
  ReplaySubject,
  Subject,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ConnectorDefinition,
  ConnectorParameters,
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
import { injectScript, SDKService } from '@flaps/core';
import { SitemapConnector } from './sources/sitemap';
import { NucliaOptions, WritableKnowledgeBox } from '@nuclia/core';
import { DynamicConnectorWrapper } from './dynamic-connector';
import { HttpClient } from '@angular/common/http';
import { FolderConnector } from './sources/folder';
import { SharepointImpl } from './sources/sharepoint';
import { ConfluenceConnector } from './sources/confluence';
import { OauthConnector } from './sources/oauth';

export const ACCOUNT_KEY = 'NUCLIA_ACCOUNT';
export const LOCAL_SYNC_SERVER = 'http://localhost:5001';
export const SYNC_SERVER_KEY = 'NUCLIA_SYNC_SERVER';
const SOURCE_NAME_KEY = 'NUCLIA_SOURCE_NAME';

interface Sync {
  date: string;
  source: string;
  destination: {
    id: string;
    params: ConnectorParameters;
  };
  items: SyncItem[];
  started?: boolean;
  completed?: boolean;
  resumable?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SyncService {
  sources: {
    [id: string]: {
      definition: SourceConnectorDefinition;
      settings: ConnectorSettings;
      instance?: ReplaySubject<ISourceConnector>;
    };
  } = {
    gdrive: {
      definition: {
        id: 'gdrive',
        title: 'Google Drive',
        logo: 'assets/logos/gdrive.svg',
        description: 'File storage and synchronization service developed by Google',
        factory: () => of(new OauthConnector('gdrive')),
      },
      settings: {},
    },
    onedrive: {
      definition: {
        id: 'onedrive',
        title: 'One Drive',
        logo: 'assets/logos/onedrive.svg',
        description: 'Microsoft OneDrive file hosting service',
        factory: () => of(new OauthConnector('onedrive')),
      },
      settings: {},
    },
    sharepoint: {
      definition: {
        id: 'sharepoint',
        title: 'SharePoint',
        logo: 'assets/logos/sharepoint.svg',
        description: 'Microsoft Sharepoint service',
        permanentSyncOnly: true,
        factory: () => of(new SharepointImpl('sharepoint')),
      },
      settings: {},
    },
    dropbox: {
      definition: {
        id: 'dropbox',
        title: 'Dropbox',
        logo: 'assets/logos/dropbox.svg',
        description: 'File storage and synchronization service developed by Dropbox',
        factory: () => of(new OauthConnector('dropbox')),
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
      settings: environment.connectors.nucliacloud,
    },
  };
  sourceObs = new BehaviorSubject(Object.values(this.sources).map((obj) => obj.definition));
  private _syncServer = new BehaviorSubject<string>(localStorage.getItem(SYNC_SERVER_KEY) || '');
  syncServer = this._syncServer.asObservable();

  private _step = new BehaviorSubject<number>(0);
  step = this._step.asObservable();
  private _showSource = new Subject<{ connectorId: string; quickAccessName: string; edit: boolean }>();
  showSource = this._showSource.asObservable();
  private _showFirstStep = new Subject<void>();
  showFirstStep = this._showFirstStep.asObservable();
  private _isServerDown = new BehaviorSubject<boolean>(true);
  isServerDown = this._isServerDown.asObservable();
  private _sourcesCache = new BehaviorSubject<{ [id: string]: Source }>({});
  sourcesCache = this._sourcesCache.asObservable();
  currentSource = this.sourcesCache.pipe(map((sources) => sources[this.getCurrentSourceId()]));

  constructor(
    private sdk: SDKService,
    private http: HttpClient,
  ) {
    const account = this.getAccountId();
    if (account) {
      this.setAccount();
    }
    // UNCOMMENT TO ENABLE DYNAMIC CONNECTORS
    // this.fetchDynamicConnectors();

    of(true)
      .pipe(
        filter(() => !!this._syncServer.getValue()),
        switchMap(() => this.serverStatus(this._syncServer.getValue())),
        map((res) => !res.running),
        repeat({ delay: 5000 }),
      )
      .subscribe(this._isServerDown);
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

  getConnectors(type: 'sources' | 'destinations'): ConnectorDefinition[] {
    return Object.values(this[type])
      .map((obj) => obj.definition)
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  getSource(id: string): Observable<ISourceConnector> {
    if (!this.sources[id].instance) {
      this.sources[id].instance = new ReplaySubject(1);
      this.sources[id].definition
        .factory(this.sources[id].settings)
        .subscribe(this.sources[id].instance as ReplaySubject<ISourceConnector>);
    }
    return (this.sources[id].instance as ReplaySubject<ISourceConnector>).asObservable();
  }
  getDestination(id: string): Observable<IDestinationConnector> {
    return this.destinations[id].definition.factory(this.destinations[id].settings);
  }

  setSourceData(sourceId: string, source: Source): Observable<void> {
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

  addSync(sync: Sync): Observable<boolean> {
    return this.getSourceData(sync.source)
      .pipe(
        switchMap((source) =>
          sync.destination.id === 'nucliacloud'
            ? this.getKb(sync.destination.params.kb).pipe(
                switchMap((kb) => {
                  if (source.kb && source.kb.knowledgeBox === kb.id && source.kb.apiKey) {
                    return of(source);
                  } else {
                    return this.getNucliaKey(kb).pipe(
                      map((data) => ({
                        ...source,
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
              )
            : of(source),
        ),
      )
      .pipe(
        switchMap((source) =>
          this.http.patch<void>(`${this._syncServer.getValue()}/source/${sync.source}`, {
            ...source,
            items: sync.items,
          }),
        ),
        map(() => true),
      );
  }

  getAccountId(): string {
    return localStorage.getItem(ACCOUNT_KEY) || '';
  }

  selectAccount(account: string) {
    localStorage.setItem(ACCOUNT_KEY, account);
    this.setAccount();
  }

  setAccount() {
    this.sdk
      .setCurrentAccount(this.getAccountId())
      .pipe(
        take(1),
        switchMap(() =>
          this.sdk.nuclia.db.getAccount(this.getAccountId()).pipe(
            tap((account) => (this.sdk.nuclia.options.accountType = account.type)),
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

  goToFirstStep() {
    this._showFirstStep.next();
  }

  goToSource(connectorId: string, quickAccessName: string, edit: boolean) {
    this.setCurrentSourceId(quickAccessName);
    this._showSource.next({ connectorId, quickAccessName, edit });
  }

  getSourceCache(name: string): Source {
    return this._sourcesCache.getValue()[name];
  }

  private fetchDynamicConnectors() {
    (window as any).registerConnector = (connector: any) => {
      this.sources[connector.id] = {
        definition: { ...connector, factory: () => of(new DynamicConnectorWrapper(connector.factory())) },
        settings: {},
      };
      this.sourceObs.next(Object.values(this.sources).map((obj) => obj.definition));
    };
    from(
      fetch('https://nuclia.github.io/status/connectors.json').then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch connectors');
        }
        return res.json();
      }),
    )
      .pipe(switchMap((urls: string[]) => forkJoin(urls.map((url) => injectScript(url)))))
      .subscribe();
  }

  getKb(slug: string): Observable<WritableKnowledgeBox> {
    return this.sdk.currentAccount.pipe(
      take(1),
      switchMap((account) => this.sdk.nuclia.db.getKnowledgeBox(account.slug, slug)),
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
            this.setSourceData(this.getCurrentSourceId(), { ...currentSource, data: source.getParametersValues() }),
          ),
          map(() => true),
        );
      }),
    );
  }

  getCurrentSourceId(): string {
    return localStorage.getItem(SOURCE_NAME_KEY) || '';
  }

  setCurrentSourceId(id: string) {
    localStorage.setItem(SOURCE_NAME_KEY, id);
  }

  getLogs(since?: string): Observable<SyncRow[]> {
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

  logout() {
    localStorage.removeItem(ACCOUNT_KEY);
    this.sdk.nuclia.auth.logout();
  }
}
