import { Injectable } from '@angular/core';
import { concatMap, forkJoin, Observable, ReplaySubject, Subject, switchMap, take, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { GDrive } from './sources/gdrive';
import {
  FileStatus,
  ISourceConnector,
  IDestinationConnector,
  SyncItem,
  IConnector,
  ConnectorSettings,
  ConnectorDefinition,
  SourceConnectorDefinition,
  DestinationConnectorDefinition,
  ConnectorParameters,
} from './models';
import { NucliaCloudKB } from './destinations/nuclia-cloud';
import { Algolia } from './destinations/algolia';
import { SDKService } from '@flaps/auth';

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
  // nuclia = new Nuclia({
  //   account: 'erictesting',
  //   backend: 'https://stashify.cloud/api',
  //   client: 'desktop',
  //   zone: 'europe-1',
  //   // TODO: create a key on first launch when the API allows to create several
  //   zoneKey:
  //     'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6InprIn0.eyJpc3MiOiJodHRwczovL3N0YXNoaWZ5LmNsb3VkLyIsImV4cCI6MjUzMzcwNzY0ODAwLCJpYXQiOjE2NTIzMzkyOTEsInN1YiI6IjlhOGRmMWU2LWYyNzAtNGFiZS1iMTA2LWQ2ZTcwNWMwZTk0ZSIsImtleSI6IjQyMWJmY2QyLWI0ZmEtNDcwNy04NmQ5LTQ1YjBiNjgwNzFjMSJ9.oqiieZopJjsoEMUzLGwU0drb9Sux9xtPyaqDdhVQ21DEZ5YV9rx-NFFn8T4N_Gp3Moem5_EFo6acCgrMP0VoMftdG4pwp9fALWWlzrs0tPKWLMB_tliNC78wTLrEoWGWtB4Souww8BaFnS0NlUIjqkjRwX5S6tbSViAPhb7eEOMz_MM4ehDxduvCSr-qrkhe4DISih5OHzaw_7XsWHmO2BSsf_u0P1y9SNGhDhRDqLSkWxtKOEmGaGwyTJQaWolIfvUy4mVXbALXwjPDc6V9d2xqucH0q_gmrSUh5QWjUVaxv-ggxgN6cPmp4_ztaT-2WCyLNJ7kbtuPj_CTHF4NtP_0kLAI0TbiVTVAqffAzo2iy_LJcsJ1cnsqFMKoaRDl1DHo6KtOVXxQeJ3-uhuGyRHu7hm06_N4IP_gYvWV-eKvr5gS4GFQja8S2vNtdSpDv57xmFUmq5U5WkpVuPXk7Rm91R758wIgHRYpMtTfGd_ykjHDQ3P9agQcAyciD9cJp4a0Cde4Cp2sbF1kM0W8lwUwHfsh8eeC7xTSzfkI80hlJRnOQG56IOMXs-sAQu0TuaEvO4_qasDc22e3G3v3mesUFeG2ugiVFOb_uXQVLszrONW6zX3IYM9s0C_8EWOyPHgLhZlL9ziGlIaOGotg5fZKII99IRT21A1amnr58Ck',
  // });
  sources: { [id: string]: { definition: SourceConnectorDefinition; settings: ConnectorSettings } } = {
    gdrive: { definition: GDrive, settings: environment.connectors.gdrive },
  };
  destinations: { [id: string]: { definition: DestinationConnectorDefinition; settings: ConnectorSettings } } = {
    nucliacloud: {
      definition: NucliaCloudKB,
      settings: {
        account: 'erictesting',
        backend: 'https://stashify.cloud/api',
        client: 'desktop',
        zone: 'europe-1',
        // TODO: create a key on first launch when the API allows to create several
        zoneKey:
          'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6InprIn0.eyJpc3MiOiJodHRwczovL3N0YXNoaWZ5LmNsb3VkLyIsImV4cCI6MjUzMzcwNzY0ODAwLCJpYXQiOjE2NTIzMzkyOTEsInN1YiI6IjlhOGRmMWU2LWYyNzAtNGFiZS1iMTA2LWQ2ZTcwNWMwZTk0ZSIsImtleSI6IjQyMWJmY2QyLWI0ZmEtNDcwNy04NmQ5LTQ1YjBiNjgwNzFjMSJ9.oqiieZopJjsoEMUzLGwU0drb9Sux9xtPyaqDdhVQ21DEZ5YV9rx-NFFn8T4N_Gp3Moem5_EFo6acCgrMP0VoMftdG4pwp9fALWWlzrs0tPKWLMB_tliNC78wTLrEoWGWtB4Souww8BaFnS0NlUIjqkjRwX5S6tbSViAPhb7eEOMz_MM4ehDxduvCSr-qrkhe4DISih5OHzaw_7XsWHmO2BSsf_u0P1y9SNGhDhRDqLSkWxtKOEmGaGwyTJQaWolIfvUy4mVXbALXwjPDc6V9d2xqucH0q_gmrSUh5QWjUVaxv-ggxgN6cPmp4_ztaT-2WCyLNJ7kbtuPj_CTHF4NtP_0kLAI0TbiVTVAqffAzo2iy_LJcsJ1cnsqFMKoaRDl1DHo6KtOVXxQeJ3-uhuGyRHu7hm06_N4IP_gYvWV-eKvr5gS4GFQja8S2vNtdSpDv57xmFUmq5U5WkpVuPXk7Rm91R758wIgHRYpMtTfGd_ykjHDQ3P9agQcAyciD9cJp4a0Cde4Cp2sbF1kM0W8lwUwHfsh8eeC7xTSzfkI80hlJRnOQG56IOMXs-sAQu0TuaEvO4_qasDc22e3G3v3mesUFeG2ugiVFOb_uXQVLszrONW6zX3IYM9s0C_8EWOyPHgLhZlL9ziGlIaOGotg5fZKII99IRT21A1amnr58Ck',
      },
    },
    algolia: { definition: Algolia, settings: {} },
  };

  private _queue: Sync[] = [];
  queue = new ReplaySubject<Sync[]>(1);

  constructor(private sdk: SDKService) {
    //     create a key first time we launch desktop
    //     use header X-STF-Zonekey to push and pull
    //     - first call /upload https://github.com/nuclia/backend/blob/master/processing/proxy/nucliadb_proxy/api/v1/tus_api.py#L315
    //     with as many field I want, I get a json token for each
    // - then I call push with a PushPayload indicating all the fields (the values are the tokens), I get an id
    // - then pull regularly to see what is processed (it returns a protobuf)
    this.watchProcessing();
    const account = this.getAccount();
    if (account) {
      this.sdk.setCurrentAccount(account);
    }
    this._queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    this.onQueueUpdate();
    this.sdk.nuclia.options.zoneKey =
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6InprIn0.eyJpc3MiOiJodHRwczovL3N0YXNoaWZ5LmNsb3VkLyIsImV4cCI6MjUzMzcwNzY0ODAwLCJpYXQiOjE2NTIzMzkyOTEsInN1YiI6IjlhOGRmMWU2LWYyNzAtNGFiZS1iMTA2LWQ2ZTcwNWMwZTk0ZSIsImtleSI6IjQyMWJmY2QyLWI0ZmEtNDcwNy04NmQ5LTQ1YjBiNjgwNzFjMSJ9.oqiieZopJjsoEMUzLGwU0drb9Sux9xtPyaqDdhVQ21DEZ5YV9rx-NFFn8T4N_Gp3Moem5_EFo6acCgrMP0VoMftdG4pwp9fALWWlzrs0tPKWLMB_tliNC78wTLrEoWGWtB4Souww8BaFnS0NlUIjqkjRwX5S6tbSViAPhb7eEOMz_MM4ehDxduvCSr-qrkhe4DISih5OHzaw_7XsWHmO2BSsf_u0P1y9SNGhDhRDqLSkWxtKOEmGaGwyTJQaWolIfvUy4mVXbALXwjPDc6V9d2xqucH0q_gmrSUh5QWjUVaxv-ggxgN6cPmp4_ztaT-2WCyLNJ7kbtuPj_CTHF4NtP_0kLAI0TbiVTVAqffAzo2iy_LJcsJ1cnsqFMKoaRDl1DHo6KtOVXxQeJ3-uhuGyRHu7hm06_N4IP_gYvWV-eKvr5gS4GFQja8S2vNtdSpDv57xmFUmq5U5WkpVuPXk7Rm91R758wIgHRYpMtTfGd_ykjHDQ3P9agQcAyciD9cJp4a0Cde4Cp2sbF1kM0W8lwUwHfsh8eeC7xTSzfkI80hlJRnOQG56IOMXs-sAQu0TuaEvO4_qasDc22e3G3v3mesUFeG2ugiVFOb_uXQVLszrONW6zX3IYM9s0C_8EWOyPHgLhZlL9ziGlIaOGotg5fZKII99IRT21A1amnr58Ck';
    this.start();
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
                            tap((token) => {
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
    // timer(0, 10000)
    //   .pipe(switchMap(() => this.nuclia.db.pull()))
    //   .subscribe();
  }

  onQueueUpdate() {
    this.queue.next(this._queue);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(this._queue));
  }

  getAccount(): string {
    return localStorage.getItem(ACCOUNT_KEY) || '';
  }

  setAccount(account: string) {
    localStorage.setItem(ACCOUNT_KEY, account);
    this.sdk.setCurrentAccount(account);
  }
}
