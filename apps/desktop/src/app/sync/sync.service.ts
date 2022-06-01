import { Injectable } from '@angular/core';
import {
  concatMap,
  delay,
  forkJoin,
  interval,
  Observable,
  of,
  repeatWhen,
  ReplaySubject,
  Subject,
  switchMap,
  switchMapTo,
  take,
  tap,
} from 'rxjs';
import { environment } from '../../environments/environment';
import { GDrive } from './sources/gdrive';
import {
  FileStatus,
  ISourceConnector,
  IDestinationConnector,
  SyncItem,
  ConnectorSettings,
  ConnectorDefinition,
  SourceConnectorDefinition,
  DestinationConnectorDefinition,
  ConnectorParameters,
} from './models';
import { NucliaCloudKB } from './destinations/nuclia-cloud';
import { Algolia } from './destinations/algolia';
import { SDKService, UserService } from '@flaps/auth';
import { DropboxConnector } from './sources/dropbox';

const ACCOUNT_KEY = 'NUCLIA_ACCOUNT';
const QUEUE_KEY = 'NUCLIA_QUEUE';

interface Sync {
  date: string;
  source: string;
  destination: {
    id: string;
    params?: ConnectorParameters;
  };
  files: SyncItem[];
  started?: boolean;
  completed?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SyncService {
  sources: { [id: string]: { definition: SourceConnectorDefinition; settings: ConnectorSettings } } = {
    gdrive: { definition: GDrive, settings: environment.connectors.gdrive },
    dropbox: { definition: DropboxConnector, settings: environment.connectors.dropbox },
  };
  destinations: { [id: string]: { definition: DestinationConnectorDefinition; settings: ConnectorSettings } } = {
    nucliacloud: {
      definition: NucliaCloudKB,
      settings: environment.connectors.nucliacloud,
    },
    algolia: { definition: Algolia, settings: {} },
  };

  private _queue: Sync[] = [];
  queue = new ReplaySubject<Sync[]>(1);
  ready = new Subject<void>();

  constructor(private sdk: SDKService, private user: UserService) {
    //     create a key first time we launch desktop
    //     use header X-STF-Zonekey to push and pull
    //     - first call /upload https://github.com/nuclia/backend/blob/master/processing/proxy/nucliadb_proxy/api/v1/tus_api.py#L315
    //     with as many field I want, I get a json token for each
    // - then I call push with a PushPayload indicating all the fields (the values are the tokens), I get an id
    // - then pull regularly to see what is processed (it returns a protobuf)
    this.ready.subscribe(() => {
      this.watchProcessing();
      this.start();
    });
    const account = this.getAccountId();
    if (account) {
      this.setAccount();
    }
    this._queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    this.onQueueUpdate();
  }

  getConnectors(type: 'sources' | 'destinations'): ConnectorDefinition[] {
    return Object.values(this[type])
      .map((obj) => obj.definition)
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  getSource(id: string): Observable<ISourceConnector> {
    return this.sources[id].definition.factory(this.sources[id].settings);
  }
  getDestination(id: string): Observable<IDestinationConnector> {
    return this.destinations[id].definition.factory(this.destinations[id].settings);
  }

  private start() {
    forkJoin(
      this._queue
        .filter((sync) => !sync.started)
        .map((sync) =>
          forkJoin([this.getSource(sync.source), this.getDestination(sync.destination.id)]).pipe(
            switchMap(([sourceInstance, destinationInstance]) => {
              sync.started = true;
              // TODO: go 6 by 6 maximum
              return forkJoin(
                sync.files
                  .filter((f) => f.status === FileStatus.PENDING)
                  .map((f) =>
                    sourceInstance.download(f).pipe(
                      concatMap((blob) => {
                        if (sync.destination.id === 'nucliacloud') {
                          return destinationInstance.upload(f.title, blob, sync.destination.params).pipe(
                            tap(() => {
                              f.status = FileStatus.UPLOADED;
                              this.onQueueUpdate();
                            }),
                          );
                        } else {
                          return this.sdk.nuclia.db.upload(new File([blob], f.title)).pipe(
                            tap(() => {
                              f.status = FileStatus.PROCESSED;
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
              sync.completed = true;
              this.onQueueUpdate();
            }),
          ),
        ),
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
      .pipe(repeatWhen((obs) => obs.pipe(delay(10000))))
      .subscribe();
  }

  onQueueUpdate() {
    this.queue.next(this._queue);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(this._queue));
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
