import { Observable } from 'rxjs';

export interface IConnector {
  id: string;
  title: string;
  logo: string;
  description: string;
}

export interface ISourceConnector extends IConnector {
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

export interface ConnectorSettings {
  [key: string]: string;
}

export interface IDestinationConnector extends IConnector {
  getParameters(): Observable<Field[]>;
  init(settings?: ConnectorSettings): Observable<boolean>;
  authenticate(): Observable<boolean>;
  upload(filename: string, blob: Blob): Observable<void>;
}

export interface Field {
  id: string;
  label: string;
  help?: string;
  type: 'text' | 'select';
  options?: { label: string; value: string }[];
}
