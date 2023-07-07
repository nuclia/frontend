import { NucliaOptions } from '@nuclia/core';
import { Observable } from 'rxjs';

export const CONNECTOR_ID_KEY = 'NUCLIA_CONNECTOR_ID';
export const CONNECTOR_PARAMS_CACHE = 'CONNECTOR_PARAMS_CACHE';
export interface ConnectorDefinition {
  id: string;
  title: string;
  logo: string;
  description: string;
  helpUrl?: string;
  permanentSyncOnly?: boolean;
}

export interface SourceConnectorDefinition extends ConnectorDefinition {
  factory: (data?: ConnectorSettings) => Observable<ISourceConnector>;
}
export interface DestinationConnectorDefinition extends ConnectorDefinition {
  factory: (data?: ConnectorSettings) => Observable<IDestinationConnector>;
}

export interface ISourceConnectorOld {
  hasServerSideAuth: boolean;
  isExternal: boolean;
  getParameters(): Observable<Field[]>;
  handleParameters?(params: ConnectorParameters): void;
  goToOAuth(reset?: boolean): void;
  authenticate(): Observable<boolean>;
  getLink?(resource: SyncItem): Observable<{ uri: string; extra_headers: { [key: string]: string } }>;
  isAuthError?: (message: any) => boolean;
}

export interface ISourceConnector {
  hasServerSideAuth: boolean;
  isExternal: boolean;
  getParameters(): Observable<Field[]>;
  handleParameters?(params: ConnectorParameters): void;
  getParametersValues(): ConnectorParameters;
  goToOAuth(reset?: boolean): void;
  authenticate(): Observable<boolean>;
  getLink?(resource: SyncItem): Observable<{ uri: string; extra_headers: { [key: string]: string } }>;
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
  placeholder?: string;
  type: 'text' | 'select' | 'folder' | 'textarea';
  options?: { label: string; value: string; disabled?: boolean }[];
  required?: boolean;
  pattern?: string | RegExp;
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
}

export interface SyncRow {
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
