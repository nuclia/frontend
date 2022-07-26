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

export interface ISourceConnector {
  hasServerSideAuth: boolean;
  resumable: boolean;
  getParameters(): Observable<Field[]>;
  goToOAuth(reset?: boolean): void;
  authenticate(params?: ConnectorParameters): Observable<boolean>;
  getFiles(query?: string, pageSize?: number): Observable<SearchResults>;
  download(resource: SyncItem): Observable<Blob>;
}

export enum FileStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  UPLOADED = 'UPLOADED',
}

export interface SyncItem {
  uuid: string;
  title: string;
  originalId: string;
  metadata: { [key: string]: string };
  status: FileStatus;
}

export interface SearchResults {
  items: SyncItem[];
  nextPage?: Observable<SearchResults>;
}

export interface ConnectorSettings {
  [key: string]: string;
}

export interface ConnectorParameters {
  [key: string]: any;
}

export interface IDestinationConnector {
  getParameters(): Observable<Field[]>;
  authenticate(): Observable<boolean>;
  upload(filename: string, params: ConnectorParameters, data: { blob?: Blob; metadata?: any }): Observable<void>;
}

export interface Field {
  id: string;
  label: string;
  help?: string;
  type: 'text' | 'select' | 'folder';
  options?: { label: string; value: string }[];
  required?: boolean;
}
