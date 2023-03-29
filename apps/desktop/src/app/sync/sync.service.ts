import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  concatMap,
  delay,
  filter,
  forkJoin,
  from,
  map,
  Observable,
  of,
  repeatWhen,
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
  FileStatus,
  IDestinationConnector,
  ISourceConnector,
  SearchResults,
  SourceConnectorDefinition,
  SyncItem,
} from './models';
import { NucliaCloudKB } from './destinations/nuclia-cloud';
import { Algolia } from './destinations/algolia';
import { injectScript, md5, SDKService, UserService } from '@flaps/core';
import { DropboxConnector } from './sources/dropbox';
import { FolderConnector } from './sources/folder';
import { S3Connector } from './sources/s3';
import { NucliaOptions, ProcessingPullResponse, WritableKnowledgeBox } from '@nuclia/core';
import { convertDataURIToBinary, NucliaProtobufConverter } from './protobuf';
import { GCSConnector } from './sources/gcs';
import { OneDriveConnector } from './sources/onedrive';
import { BrightcoveConnector } from './sources/brightcove';
import { DynamicConnectorWrapper } from './dynamic-connector';
import { HttpClient } from '@angular/common/http';

const ACCOUNT_KEY = 'NUCLIA_ACCOUNT';
const QUEUE_KEY = 'NUCLIA_QUEUE';
const SYNC_SERVER = 'http://localhost:5001';

interface Sync {
  date: string;
  source: string;
  destination: {
    id: string;
    params: ConnectorParameters;
  };
  files: SyncItem[];
  fileUUIDs: string[];
  started?: boolean;
  completed?: boolean;
  resumable?: boolean;
}

// TODO: share models between server and Angular app
interface Source {
  connectorId: string;
  data: ConnectorParameters;
  kb?: NucliaOptions;
  items?: SyncItem[];
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
    // Disable algolia for now
    // algolia: {
    //   definition: Algolia,
    //   settings: {},
    // },
  };
  sourceObs = new BehaviorSubject(Object.values(this.sources).map((obj) => obj.definition));

  private _queue: Sync[] = [];
  queue = new ReplaySubject<Sync[]>(1);
  ready = new Subject<void>();

  private _step = new BehaviorSubject<number>(0);
  step = this._step.asObservable();
  private _showSource = new Subject<{ connectorId: string; quickAccessName: string; edit: boolean }>();
  showSource = this._showSource.asObservable();
  private _showFirstStep = new Subject<void>();
  showFirstStep = this._showFirstStep.asObservable();

  constructor(private sdk: SDKService, private user: UserService, private http: HttpClient) {
    this.ready.subscribe(() => {
      this.watchProcessing();
      this.start();
    });
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

  private start() {
    combineLatest(
      this._queue
        .filter((sync) => !sync.started && !sync.completed)
        .map((sync) => {
          return combineLatest([
            this.getSource(sync.source).pipe(take(1)),
            this.getDestination(sync.destination.id).pipe(take(1)),
          ]).pipe(
            concatMap(([sourceInstance, destinationInstance]) => {
              sync.started = true;
              // TODO: go 6 by 6 maximum
              return forkJoin(
                sync.files
                  .filter((f) => f.status === FileStatus.PENDING)
                  .map((f) => {
                    if (sourceInstance.isExternal) {
                      return (
                        sourceInstance.getLink &&
                        sourceInstance.getLink(f).pipe(
                          catchError((error) => {
                            this.handle403(sourceInstance, error);
                            throw error;
                          }),
                          filter((link) => !!link.uri),
                          concatMap((link) =>
                            destinationInstance.uploadLink!(f.title, sync.destination.params, link).pipe(
                              tap(() => {
                                f.status = FileStatus.UPLOADED;
                                this.onQueueUpdate();
                              }),
                            ),
                          ),
                          take(1),
                        )
                      );
                    } else {
                      return sourceInstance.download(f).pipe(
                        catchError((error) => {
                          this.handle403(sourceInstance, error);
                          throw error;
                        }),
                        concatMap((blob) => {
                          if (sync.destination.id === 'nucliacloud') {
                            return destinationInstance
                              .upload(f.originalId, f.title, sync.destination.params, { blob })
                              .pipe(
                                catchError((error) => {
                                  f.status = FileStatus.ERROR;
                                  f.error = error.toString();
                                  this.onQueueUpdate();
                                  return of(undefined);
                                }),
                                tap(() => {
                                  f.status = FileStatus.ERROR ? FileStatus.ERROR : FileStatus.UPLOADED;
                                  this.onQueueUpdate();
                                }),
                              );
                          } else {
                            return md5(new File([blob], f.title)).pipe(
                              concatMap((file) => this.sdk.nuclia.db.upload(file)),
                              tap((response) => {
                                f.status = FileStatus.PROCESSING;
                                f.uuid = response.uuid;
                                sync.fileUUIDs.push(response.uuid);
                                this.onQueueUpdate();
                              }),
                            );
                          }
                        }),
                        take(1),
                      );
                    }
                  }),
              );
            }),
            tap(() => {
              sync.completed = true;
              this.onQueueUpdate();
            }),
          );
        }),
    ).subscribe();
  }

  setSourceData(sourceId: string, connectorId: string, data?: ConnectorParameters): Observable<void> {
    return this.http.post<void>(`${SYNC_SERVER}/source`, { [sourceId]: { connectorId, data } });
  }

  getSourceData(sourceId: string): Observable<Source> {
    return this.http.get<Source>(`${SYNC_SERVER}/source/${sourceId}`);
  }

  getFiles(sourceId: string, query?: string): Observable<SearchResults> {
    return this.http.get<SearchResults>(`${SYNC_SERVER}/source/${sourceId}/search${query ? `?query=${query}` : ''}`);
  }

  addSync(sync: Sync) {
    return (
      sync.destination.id === 'nucliacloud'
        ? forkJoin([this.getSourceData(sync.source), this.getKb(sync.destination.params.kb)]).pipe(
            switchMap(([source, kb]) => {
              if (source.kb && source.kb.knowledgeBox === kb.id && source.kb.apiKey) {
                return of(source.kb);
              } else {
                return this.getNucliaKey(kb).pipe(
                  map(
                    (data) =>
                      ({
                        zone: this.sdk.nuclia.options.zone,
                        backend: this.sdk.nuclia.options.backend,
                        knowledgeBox: data.kbid,
                        apiKey: data.token,
                      } as NucliaOptions),
                  ),
                );
              }
            }),
          )
        : of({})
    ).pipe(
      switchMap((options) =>
        this.http.patch<void>(`${SYNC_SERVER}/source/${sync.source}`, {
          kb: options,
          items: sync.files,
        }),
      ),
    );
    // this._queue.push(sync);
    // this.onQueueUpdate();
    // this.start();
  }

  clearCompleted() {
    this._queue = this._queue.filter((sync) => !sync.completed);
    this.onQueueUpdate();
  }

  private watchProcessing() {
    return this.sdk.nuclia.db
      .pull()
      .pipe(
        repeatWhen((obs) => obs.pipe(delay(10000))),
        filter((res: ProcessingPullResponse) => res.status !== 'empty' && !!res.payload),
        map((res) => res.payload as string),
        switchMap((base64) => NucliaProtobufConverter(convertDataURIToBinary(base64))),
        map((data: any) => ({ data, sync: this._queue.find((sync) => sync.fileUUIDs.includes(data.uuid)) })),
        filter(({ sync }) => !!sync),
        map(({ data, sync }) => ({ data, sync, item: (sync as Sync).files.find((file) => file.uuid === data.uuid) })),
        filter(({ data, sync, item }) => !!item),
        map(
          ({ data, sync, item }) =>
            ({ data, sync, item } as {
              data: any;
              sync: Sync;
              item: SyncItem;
            }),
        ),
        switchMap(({ data, sync, item }) => {
          return this.getDestination(sync.destination.id).pipe(
            switchMap((dest) =>
              dest.upload(item.originalId, item.title, sync.destination.params, {
                metadata: data,
              }),
            ),
            tap(() => {
              item.status = FileStatus.UPLOADED;
              sync.completed = sync.files.every((file: SyncItem) => file.status === FileStatus.UPLOADED);
              this.onQueueUpdate();
            }),
          );
        }),
      )
      .subscribe();
  }

  private handle403(source: ISourceConnector, error: any) {
    if (error.status === 403) {
      if (source.hasServerSideAuth) {
        source.goToOAuth(true);
      }
    }
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
          !this.sdk.nuclia.db.hasNUAClient()
            ? this.user.userPrefs.pipe(
                switchMap((prefs) => {
                  const client_id = (window as any)['electron']
                    ? (window as any)['electron'].getMachineId()
                    : this.sdk.nuclia.auth.getJWTUser()?.sub || '';
                  return this.sdk.nuclia.db.createNUAClient(this.getAccountId(), {
                    client_id,
                    contact: prefs?.email || '',
                    title: 'NDA NUA key',
                  });
                }),
              )
            : of(true),
        ),
        switchMap(() =>
          this.sdk.nuclia.db.getAccount(this.getAccountId()).pipe(
            tap((account) => (this.sdk.nuclia.options.accountType = account.type)),
            switchMap((account) => this.sdk.nuclia.rest.getZoneSlug(account.zone)),
            tap((zone) => (this.sdk.nuclia.options.zone = zone)),
          ),
        ),
      )
      .subscribe(() => this.ready.next());
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

  getConnectorsCache(): { [key: string]: ConnectorCache } {
    try {
      const cache = localStorage.getItem(CONNECTOR_PARAMS_CACHE) || '{}';
      return JSON.parse(cache);
    } catch (error) {
      return {};
    }
  }

  getConnectorCache(connectorId: string, name: string): ConnectorCache {
    return this.getConnectorsCache()[`${connectorId}-${name}`];
  }

  saveConnectorCache(connectorId: string, name: string, params: any) {
    const cache = this.getConnectorsCache();
    localStorage.setItem(
      CONNECTOR_PARAMS_CACHE,
      JSON.stringify({ ...cache, [`${connectorId}-${name}`]: { connectorId, name, params } }),
    );
  }

  removeConnectorCache(connectorId: string, name: string) {
    const cache = this.getConnectorsCache();
    delete cache[`${connectorId}-${name}`];
    localStorage.setItem(CONNECTOR_PARAMS_CACHE, JSON.stringify(cache));
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
}
