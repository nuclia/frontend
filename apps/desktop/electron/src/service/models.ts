import type { NucliaOptions } from '@nuclia/core';
import { Observable } from 'rxjs';

export interface Source {
  connectorId: string;
  data: ConnectorParameters;
  kb?: NucliaOptions;
  folders?: SyncItem[];
  items?: SyncItem[];
  permanentSync?: boolean;
  lastSyncGMT?: string;
  total?: number;
  lastBatch?: number;
}

export interface ConnectorDefinition {
  id: string;
}

export interface SourceConnectorDefinition extends ConnectorDefinition {
  factory: (data?: ConnectorSettings) => ISourceConnector;
}
export interface DestinationConnectorDefinition extends ConnectorDefinition {
  factory: (data?: ConnectorSettings) => Observable<IDestinationConnector>;
}

export interface Link {
  uri: string;
  extra_headers: { [key: string]: string };
}
export interface ISourceConnector {
  isExternal: boolean;
  setParameters(params: ConnectorParameters): void;
  getParameters(): ConnectorParameters;
  getFolders(query?: string): Observable<SearchResults>;
  getFiles(query?: string): Observable<SearchResults>;
  getLastModified(since: string, folders?: SyncItem[]): Observable<SyncItem[]>;
  download(resource: SyncItem): Observable<Blob | undefined>;
  getLink(resource: SyncItem): Observable<Link>;
  hasAuthData(): boolean;
  refreshAuthentication(): Observable<boolean>;
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
  modifiedGMT?: string;
  isFolder?: boolean;
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
  refreshField(fieldId: string): Observable<Field | undefined>;
  getParameters(): Observable<Field[]>;
  authenticate(): Observable<boolean>;
  upload(
    originalId: string,
    filename: string,
    params: ConnectorParameters,
    data: { blob?: Blob; metadata?: any },
  ): Observable<void>;
  uploadLink?(
    filename: string,
    params: ConnectorParameters,
    data: { uri: string; extra_headers: { [key: string]: string } },
  ): Observable<void>;
}

export interface Field {
  id: string;
  label: string;
  help?: string;
  type: 'text' | 'select' | 'folder' | 'textarea';
  options?: { label: string; value: string; disabled?: boolean }[];
  required?: boolean;
  canBeRefreshed?: boolean;
}

export interface LogRow {
  date: string;
  from: string;
  to: string;
  total: number;
  kbSlug?: string;
  progress: number;
  started: boolean | undefined;
  completed: boolean | undefined;
  errors: string;
}
