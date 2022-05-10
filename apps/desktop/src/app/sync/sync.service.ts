import { Injectable } from '@angular/core';
import { concatMap, forkJoin, switchMap, take, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { GDrive } from './download/gdrive';
import { FileStatus, IDownloadConnector, IUploadConnector, IUploadConnectorSettings, SyncItem } from './models';
import { NucliaCloudKB } from './upload/nuclia-cloud';

interface Sync {
  provider: string;
  receiver: {
    id: string;
    settings: IUploadConnectorSettings;
  };
  files: SyncItem[];
  started?: boolean;
  completed?: boolean;
}
@Injectable({ providedIn: 'root' })
export class SyncService {
  providers: { [id: string]: IDownloadConnector } = {
    gdrive: new GDrive(environment.connectors.gdrive),
  };
  receivers: { [id: string]: IUploadConnector<any> } = {
    kb: new NucliaCloudKB({
      account: 'erictesting',
      backend: 'https://stashify.cloud/api',
      client: 'desktop',
    }),
  };

  queue: Sync[] = [];

  constructor() {}

  private start() {
    forkJoin(
      this.queue
        .filter((sync) => !sync.started)
        .map((sync) => {
          const provider = this.providers[sync.provider];
          const receiver = this.receivers[sync.receiver.id];
          return receiver.init(sync.receiver.settings).pipe(
            switchMap(() => {
              sync.started = true;
              // TODO: go 6 by 6 maximum
              return forkJoin(
                sync.files
                  .filter((f) => f.status === FileStatus.PENDING)
                  .map((f) =>
                    provider.download(f).pipe(
                      concatMap((blob) => receiver.upload(f.title, blob)),
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
