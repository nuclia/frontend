import { Observable } from 'rxjs';

export const SOURCE_ID_KEY = 'NUCLIA_SOURCE_ID';
export interface ConnectorDefinition {
  id: string;
  title: string;
  logo: string;
  description: string;
}

export interface SourceConnectorDefinition extends ConnectorDefinition {
  factory: (data?: ConnectorSettings) => Observable<ISourceConnector>;
}
export interface DestinationConnectorDefinition extends ConnectorDefinition {
  factory: (data?: ConnectorSettings) => Observable<IDestinationConnector>;
}

export interface IConnector {}

export interface ISourceConnector extends IConnector {
  hasServerSideAuth: boolean;
  goToOAuth(): void;
  authenticate(): Observable<boolean>;
  getFiles(query?: string, start?: number): Observable<SyncItem[]>;
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
  metadata: { [key: string]: string };
  status: FileStatus;
}

export interface ConnectorSettings {
  [key: string]: string;
}

export interface ConnectorParameters {
  [key: string]: string;
}

export interface IDestinationConnector extends IConnector {
  getParameters(): Observable<Field[]>;
  authenticate(): Observable<boolean>;
  upload(filename: string, blob: Blob, params?: ConnectorParameters): Observable<void>;
}

export interface Field {
  id: string;
  label: string;
  help?: string;
  type: 'text' | 'select';
  options?: { label: string; value: string }[];
}
