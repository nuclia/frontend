import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { GDrive } from './apis/gdrive';
import { IConnector } from './models';

@Injectable({ providedIn: 'root' })
export class SyncService {
  providers: { [id: string]: IConnector } = {
    gdrive: new GDrive(environment.connectors.gdrive),
  };
  constructor() {}
}
