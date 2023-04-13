import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
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
import { GDrive } from './sources/gdrive';
import {
  CONNECTOR_PARAMS_CACHE,
  ConnectorCache,
  ConnectorDefinition,
  ConnectorParameters,
  ConnectorSettings,
  DestinationConnectorDefinition,
  IDestinationConnector,
  ISourceConnector,
  SearchResults,
  SourceConnectorDefinition,
  SyncItem,
  Source,
  SOURCE_NAME_KEY,
} from './models';
import { NucliaCloudKB } from './destinations/nuclia-cloud';
import { injectScript, SDKService, UserService } from '@flaps/core';
import { DropboxConnector } from './sources/dropbox';
import { FolderConnector } from './sources/folder';
import { S3Connector } from './sources/s3';
import { NucliaOptions, WritableKnowledgeBox } from '@nuclia/core';
import { GCSConnector } from './sources/gcs';
import { OneDriveConnector } from './sources/onedrive';
import { BrightcoveConnector } from './sources/brightcove';
import { DynamicConnectorWrapper } from './dynamic-connector';
import { HttpClient } from '@angular/common/http';

const ACCOUNT_KEY = 'NUCLIA_ACCOUNT';
const QUEUE_KEY = 'NUCLIA_QUEUE';
const LOCAL_SYNC_SERVER = 'http://localhost:5001';
const SYNC_SERVER_KEY = 'NUCLIA_SYNC_SERVER';

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
    gdrive: { definition: GDrive, settings: {} },
    onedrive: { definition: OneDriveConnector, settings: {} },
    dropbox: { definition: DropboxConnector, settings: {} },
    folder: { definition: FolderConnector, settings: {} },
    s3: { definition: S3Connector, settings: {} },
    gcs: { definition: GCSConnector, settings: {} },
    brightcove: { definition: BrightcoveConnector, settings: {} },
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

  private _queue: Sync[] = [];
  queue = new ReplaySubject<Sync[]>(1);

  private _step = new BehaviorSubject<number>(0);
  step = this._step.asObservable();
  private _showSource = new Subject<{ connectorId: string; quickAccessName: string; edit: boolean }>();
  showSource = this._showSource.asObservable();
  private _showFirstStep = new Subject<void>();
  showFirstStep = this._showFirstStep.asObservable();
  private _sourcesCache = new BehaviorSubject<{ [id: string]: Source }>({});
  sourcesCache = this._sourcesCache.asObservable();
  currentSource = this.sourcesCache.pipe(map((sources) => sources[localStorage.getItem(SOURCE_NAME_KEY) || '']));

  constructor(private sdk: SDKService, private user: UserService, private http: HttpClient) {
    const account = this.getAccountId();
    if (account) {
      this.setAccount();
    }
    const queue: Sync[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    Object.values(queue).forEach((sync) => {
      if (!sync.completed) {
        sync.started = false;
      }
    });
    this._queue = queue;
    this.onQueueUpdate();
    this.fetchDynamicConnectors();
    this._syncServer
      .pipe(
        filter((server) => !!server),
        switchMap(() => this.getSources()),
      )
      .subscribe((sources) => {
        this._sourcesCache.next(sources);
      });
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

  getSources(): Observable<{ [id: string]: Source }> {
    return this.http.get<{ [id: string]: Source }>(`${this._syncServer.getValue()}/sources`);
  }

  getFiles(sourceId: string, query?: string): Observable<SearchResults> {
    return this.http.get<SearchResults>(
      `${this._syncServer.getValue()}/source/${sourceId}/files/search${query ? `?query=${query}` : ''}`,
    );
  }

  getFolders(sourceId: string, query?: string): Observable<SearchResults> {
    return this.http.get<SearchResults>(
      `${this._syncServer.getValue()}/source/${sourceId}/folders/search${query ? `?query=${query}` : ''}`,
    );
  }

  addSync(sync: Sync) {
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
                        options: {
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
      );
  }

  clearCompleted() {
    this._queue = this._queue.filter((sync) => !sync.completed);
    this.onQueueUpdate();
  }

  onQueueUpdate() {
    this.queue.next(this._queue);
    localStorage.setItem(
      QUEUE_KEY,
      JSON.stringify(this._queue.filter((sync) => !(!sync.resumable && !sync.completed))),
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
    return this.http.get<{ running: boolean }>(`${server}/status`).pipe(catchError(() => of({ running: false })));
  }

  isServerDown(): Observable<boolean> {
    return of(true).pipe(
      filter(() => !!this._syncServer.getValue()),
      switchMap(() => this.serverStatus(this._syncServer.getValue())),
      map((res) => !res.running),
      repeat({ delay: 5000 }),
    );
  }

  setSyncServer(server: { url?: string; local?: boolean }) {
    if (server.local) {
      this._syncServer.next(LOCAL_SYNC_SERVER);
      localStorage.setItem(SYNC_SERVER_KEY, LOCAL_SYNC_SERVER);
      this.serverStatus(LOCAL_SYNC_SERVER).subscribe((res) => {
        if (!res.running && (window as any)['electron']) {
          (window as any)['electron'].startLocalServer();
        }
      });
    } else if (server.url) {
      localStorage.setItem(SYNC_SERVER_KEY, server.url);
      this._syncServer.next(server.url);
    }
  }

  resetSyncServer() {
    this._syncServer.next('');
  }
}
