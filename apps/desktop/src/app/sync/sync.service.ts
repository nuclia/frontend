import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { GDrive } from './download/gdrive';
import { IDownloadConnector, IUploadConnector } from './models';
import { NucliaKB } from './upload/nuclia-kb';

@Injectable({ providedIn: 'root' })
export class SyncService {
  providers: { [id: string]: IDownloadConnector } = {
    gdrive: new GDrive(environment.connectors.gdrive),
  };
  receivers: { [id: string]: IUploadConnector } = {
    kb: new NucliaKB({ account: '', kbSlug: '', backend: environment.backend }),
  };
  constructor() {}
}
