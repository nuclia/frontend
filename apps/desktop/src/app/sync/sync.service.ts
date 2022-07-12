import { Injectable } from '@angular/core';
import {
  catchError,
  combineLatest,
  concatMap,
  delay,
  filter,
  forkJoin,
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
  ConnectorDefinition,
  ConnectorParameters,
  ConnectorSettings,
  DestinationConnectorDefinition,
  FileStatus,
  IDestinationConnector,
  ISourceConnector,
  SourceConnectorDefinition,
  SyncItem,
} from './models';
import { NucliaCloudKB } from './destinations/nuclia-cloud';
import { Algolia } from './destinations/algolia';
import { md5, SDKService, UserService } from '@flaps/core';
import { DropboxConnector } from './sources/dropbox';
import { FolderConnector } from './sources/folder';
import { ProcessingPullResponse } from '@nuclia/core';
import { convertDataURIToBinary, NucliaProtobufConverter } from './protobuf';

const ACCOUNT_KEY = 'NUCLIA_ACCOUNT';
const QUEUE_KEY = 'NUCLIA_QUEUE';

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

@Injectable({ providedIn: 'root' })
export class SyncService {
  sources: {
    [id: string]: {
      definition: SourceConnectorDefinition;
      settings: ConnectorSettings;
      instance?: ReplaySubject<ISourceConnector>;
    };
  } = {
    gdrive: { definition: GDrive, settings: environment.connectors.gdrive },
    dropbox: { definition: DropboxConnector, settings: environment.connectors.dropbox },
    folder: { definition: FolderConnector, settings: {} },
  };
  destinations: { [id: string]: { definition: DestinationConnectorDefinition; settings: ConnectorSettings } } = {
    nucliacloud: {
      definition: NucliaCloudKB,
      settings: environment.connectors.nucliacloud,
    },
    algolia: {
      definition: Algolia,
      settings: {},
    },
  };

  private _queue: Sync[] = [];
  queue = new ReplaySubject<Sync[]>(1);
  ready = new Subject<void>();

  constructor(private sdk: SDKService, private user: UserService) {
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
                  .map((f) =>
                    sourceInstance.download(f).pipe(
                      catchError((error) => {
                        if (error.status === 403) {
                          if (sourceInstance.hasServerSideAuth) {
                            sourceInstance.goToOAuth();
                          }
                        }
                        throw error;
                      }),
                      concatMap((blob) => {
                        if (sync.destination.id === 'nucliacloud') {
                          return destinationInstance.upload(f.title, sync.destination.params, { blob }).pipe(
                            tap(() => {
                              f.status = FileStatus.UPLOADED;
                              sync.completed = true;
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
                    ),
                  ),
              );
            }),
            tap(() => {
              this.onQueueUpdate();
            }),
          );
        }),
    ).subscribe();
  }

  addSync(sync: Sync) {
    this._queue.push(sync);
    this.onQueueUpdate();
    this.start();
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
              dest.upload(item.title, sync.destination.params, {
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
}
