import { Observable } from 'rxjs';

export interface IDownloadConnector {
  data: { [key: string]: string };
  authenticate(): Observable<boolean>;
  getFiles(query?: string): Observable<SyncItem[]>;
  download(resource: SyncItem): Observable<Blob>;
}

export enum FileStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  UPLOADED = 'UPLOADED',
}

export interface SyncItem {
  title: string;
  originalId: string;
  type: string;
  status: FileStatus;
}

export interface IUploadConnectorSettings {}

export interface IUploadConnector<T extends IUploadConnectorSettings> {
  init(settings: T): Observable<boolean>;
  authenticate(): Observable<boolean>;
  upload(filename: string, blob: Blob): Observable<void>;
}
