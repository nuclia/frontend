import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { GDrive } from './download/gdrive';
import { IDownloadConnector, IUploadConnector } from './models';
import { NucliaCloudKB } from './upload/nuclia-cloud';

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
  constructor() {}
}
