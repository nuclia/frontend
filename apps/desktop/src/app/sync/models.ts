import { NucliaOptions } from '@nuclia/core';
import { Observable } from 'rxjs';

export const SOURCE_NAME_KEY = 'NUCLIA_SOURCE_NAME';
export const CONNECTOR_ID_KEY = 'NUCLIA_CONNECTOR_ID';
export const CONNECTOR_PARAMS_CACHE = 'CONNECTOR_PARAMS_CACHE';
export interface ConnectorDefinition {
  id: string;
  title: string;
  logo: string;
  description: string;
  helpUrl?: string;
}

export interface SourceConnectorDefinition extends ConnectorDefinition {
  factory: (data?: ConnectorSettings) => Observable<ISourceConnector>;
}
export interface DestinationConnectorDefinition extends ConnectorDefinition {
  factory: (data?: ConnectorSettings) => Observable<IDestinationConnector>;
}

export interface ISourceConnector {
  hasServerSideAuth: boolean;
  isExternal: boolean;
  getParameters(): Observable<Field[]>;
  handleParameters?(params: ConnectorParameters): void;
  goToOAuth(reset?: boolean): void;
  authenticate(): Observable<boolean>;
  getLink?(resource: SyncItem): Observable<{ uri: string; extra_headers: { [key: string]: string } }>;
  isAuthError?: (message: any) => boolean;
}

export enum FileStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  UPLOADED = 'UPLOADED',
  ERROR = 'ERROR',
}

export interface SyncItem {
  uuid: string;
  title: string;
  originalId: string;
  metadata: { [key: string]: string };
  status: FileStatus;
  error?: string;
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

export interface ConnectorCache {
  connectorId: string;
  name: string;
  params: any;
  permanentSync?: boolean;
}

export interface Source {
  connectorId: string;
  data: ConnectorParameters;
  kb?: NucliaOptions;
  items?: SyncItem[];
  permanentSync?: boolean;
  lastSync?: string;
  total?: number;
  lastBatch?: number;
}
