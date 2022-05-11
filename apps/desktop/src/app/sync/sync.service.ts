import { Injectable } from '@angular/core';
import { concatMap, forkJoin, switchMap, take, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { GDrive } from './sources/gdrive';
import { FileStatus, ISourceConnector, IDestinationConnector, SyncItem, IConnector, ConnectorSettings } from './models';
import { NucliaCloudKB } from './destinations/nuclia-cloud';

interface Sync {
  source: string;
  destination: {
    id: string;
    settings?: ConnectorSettings;
  };
  files: SyncItem[];
  started?: boolean;
  completed?: boolean;
}
@Injectable({ providedIn: 'root' })
export class SyncService {
  sources: { [id: string]: ISourceConnector } = {
    gdrive: new GDrive(environment.connectors.gdrive),
  };
  destinations: { [id: string]: IDestinationConnector } = {
    nucliacloud: new NucliaCloudKB({
      account: 'erictesting',
      backend: 'https://stashify.cloud/api',
      client: 'desktop',
    }),
  };

  queue: Sync[] = [];

  constructor() {}

  getConnectors(type: 'sources' | 'destinations'): IConnector[] {
    return Object.values(this[type]).sort((a, b) => a.title.localeCompare(b.title)) as IConnector[];
  }

  private start() {
    forkJoin(
      this.queue
        .filter((sync) => !sync.started)
        .map((sync) => {
          const source = this.sources[sync.source];
          const destination = this.destinations[sync.destination.id];
          return destination.init(sync.destination.settings).pipe(
            switchMap(() => {
              sync.started = true;
              // TODO: go 6 by 6 maximum
              return forkJoin(
                sync.files
                  .filter((f) => f.status === FileStatus.PENDING)
                  .map((f) =>
                    source.download(f).pipe(
                      concatMap((blob) => destination.upload(f.title, blob)),
                      tap(() => (f.status = FileStatus.UPLOADED)),
                      take(1),
                    ),
                  ),
              );
            }),
            tap(() => (sync.completed = true)),
          );
        }),
    ).subscribe();
  }

  addSync(sync: Sync) {
    this.queue.push(sync);
    // TODO: store in local storage
    this.start();
  }
}
