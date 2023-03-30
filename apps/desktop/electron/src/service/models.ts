import type { NucliaOptions } from '../../../../../libs/sdk-core/src';
import { Observable } from 'rxjs';

export interface Source {
  connectorId: string;
  data: ConnectorParameters;
  kb?: NucliaOptions;
  items?: SyncItem[];
  permanentSync?: boolean;
  lastSync?: string;
}

export interface ConnectorDefinition {
  id: string;
  title: string;
  logo: string;
  description: string;
}

export interface SourceConnectorDefinition extends ConnectorDefinition {
  factory: (data?: ConnectorSettings) => ISourceConnector;
}
export interface DestinationConnectorDefinition extends ConnectorDefinition {
  factory: (data?: ConnectorSettings) => Observable<IDestinationConnector>;
}

export interface ISourceConnector {
  isExternal: boolean;
  setParameters(params: ConnectorParameters): void;
  getFiles(query?: string, pageSize?: number): Observable<SearchResults>;
  getLastModified(since: string): Observable<SyncItem[]>;
  download(resource: SyncItem): Observable<Blob | undefined>;
  getLink?(resource: SyncItem): Observable<{ uri: string; extra_headers: { [key: string]: string } }>;
  isAuthError?: (message: any) => boolean;
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
  modified?: string;
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
