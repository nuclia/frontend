import type { Observable } from 'rxjs';
import type { INuclia } from '../../models';
import type { IWritableKnowledgeBox } from '../kb/kb.models';

export interface AWSS3AccessKeysCredentials {
  access_key_id: string;
  secret_access_key: string;
}
export interface AzureCertificateCredentials {
  tenant_id: string;
  client_id: string;
  pfx_base64: string;
  pfx_password: string;
}
export interface ShareFileAPIKeyCredentials {
  api_key: string;
  subdomain: string;
}
export type ExternalConnectionCredentials = { [key: string]: string };

export interface ISyncManager {
  kb: IWritableKnowledgeBox;
  nuclia: INuclia;
  createOAuthExternalConnection(provider: string): Observable<OAuthUrl>;
  createExternalConnection(provider: string, credentials: { [key: string]: string }): Observable<ExternalConnection>;
  createConfig(config: SyncConfigurationCreate): Observable<SyncConfiguration>;
  getConfigs(): Observable<SyncConfiguration[]>;
  getConfig(id: string): Observable<SyncConfiguration>;
  deleteConfig(id: string): Observable<void>;
  getConfigJobs(id: string): Observable<Job[]>;
  syncConfig(id: string, full_sync?: boolean): Observable<Job>;
  browse(
    externalConnectorId: string,
    drive_id?: string,
    path?: string,
    page_token?: string,
  ): Observable<StorageStructure>;
}

export interface OAuthUrl {
  authorize_url: string;
}
export interface ExternalConnection {
  id: string;
  kb_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  provider: string;
}

export interface SyncConfiguration {
  id: string;
  name: string;
  kb_id: string;
  created_at: string;
  updated_at: string;
  sync_root_path: string;
  drive_id?: string;
  sync_interval_minutes: number;
  created_by: string;
  external_connection: {
    id: string;
    provider: string;
  };
  provider: string;
}

export interface SyncConfigurationCreate {
  name: string;
  sync_root_path: string;
  drive_id?: string;
  external_connection_id: string;
}

export interface Job {
  id: string;
  created_at: string;
  finished_at: string | null;
  config_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  logs?: JobLog[];
}

export interface JobLog {
  level: 'INFO' | 'WARNING' | 'ERROR' | 'EXCEPTION' | 'CRITICAL';
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

export interface StorageStructure {
  drives?: StorageDrive[];
  folders?: StorageFolder[];
  next_page_token: string;
}

export interface StorageDrive {
  id: string;
  name: string;
  drive_type?: string;
  web_url?: string;
}

export interface StorageFolder {
  id: string;
  name: string;
  path: string;
  web_url?: string;
}
