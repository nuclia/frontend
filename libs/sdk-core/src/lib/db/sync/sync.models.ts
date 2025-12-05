import type { Observable } from 'rxjs';
import type { INuclia } from '../../models';
import type { IWritableKnowledgeBox } from '../kb/kb.models';

export interface ISyncManager {
  kb: IWritableKnowledgeBox;
  nuclia: INuclia;
  createConfig(config: SyncConfigurationCreate, params: any): Observable<SyncConfiguration>;
  getConfigs(): Observable<SyncConfiguration[]>;
  getConfig(id: string): Observable<SyncConfiguration>;
  deleteConfig(id: string): Observable<void>;
  getConfigJobs(id: string): Observable<Job[]>;
}

export interface SyncConfiguration {
  id: string;
  name: string;
  kb_id: string;
  created_at: string;
  updated_at: string;
  sync_root_path: string;
  sync_interval_minutes: number;
  email: string;
  provider: string;
  status: 'pending_authorization' | 'authorized';
  authorize_url?: string;
}

export interface SyncConfigurationCreate {
  name: string;
  provider: string;
}

export interface Job {
  id: string;
  created_at: string;
  finished_at: string | null;
  config_id: string;
  status: 'pending';
}
