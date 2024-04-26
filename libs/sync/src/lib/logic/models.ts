import { NucliaOptions } from '@nuclia/core';
import { Observable } from 'rxjs';
import { ColoredLabel } from '@flaps/common';

export const baseLogoPath = 'assets/connector-logos';

export const CONNECTOR_ID_KEY = 'NUCLIA_CONNECTOR_ID';
export const SOURCE_NAME_KEY = 'NUCLIA_SOURCE_NAME';
export const CONNECTOR_PARAMS_CACHE = 'CONNECTOR_PARAMS_CACHE';

export interface ConnectorDefinition {
  id: string;
  title: string;
  logo: string;
  description: string;
  helpUrl?: string;
  permanentSyncOnly?: boolean;
  factory: (data?: ConnectorSettings) => Observable<IConnector>;
}

export interface IConnector {
  hasServerSideAuth: boolean;
  isExternal: boolean;
  allowToSelectFolders: boolean;
  canSyncSecurityGroups: boolean;
  getParametersSections(): Observable<Section[]>;
  handleParameters?(params: ConnectorParameters): void;
  getParametersValues(): ConnectorParameters;
  cleanAuthData(): void;
  goToOAuth(redirect: string, reset?: boolean): void;
  authenticate(): Observable<boolean>;
  getLink?(resource: SyncItem): Observable<{ uri: string; extra_headers: { [key: string]: string } }>;
  getStaticFolders(): SyncItem[];
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
  [key: string]: any;
}

export interface ConnectorParameters {
  [key: string]: any;
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  badge?: string;
  fields: Field[];
}

export interface Field {
  id: string;
  label: string;
  help?: string;
  placeholder?: string;
  type: 'text' | 'select' | 'textarea' | 'table';
  options?: { label: string; value: string; disabled?: boolean }[];
  required?: boolean;
  pattern?: string | RegExp;
  canBeRefreshed?: boolean;
}

export interface Filters {
  fileExtensions?: {
    extensions: string;
    exclude?: boolean;
  };
  modified?: {
    from?: string;
    to?: string;
  };
}

export type Connector = {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parameters: { [key: string]: any };
};

export interface ISyncEntity {
  connector: Connector;
  kb?: NucliaOptions;
  labels?: ColoredLabel[];
  title: string;
  id: string;
  foldersToSync?: SyncItem[];
  filters?: Filters;
  lastSyncGMT?: string;
  disabled?: boolean;
  syncSecurityGroups?: boolean;
}

export interface SyncBasicData {
  id: string;
  kbId: string;
  title: string;
  connectorId: string;
  lastSyncGMT?: string;
  disabled?: boolean;
  totalSyncedResources?: number;
}

export enum LogSeverityLevel {
  low = 'low',
  medium = 'medium',
  high = 'high',
}

export interface LogEntity {
  level: LogSeverityLevel;
  message: string;
  createdAt: string;
  origin: string;
  action: string;
  payload: { [key: string]: any };
}
