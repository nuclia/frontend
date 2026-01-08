import { Observable } from 'rxjs';
import { INuclia } from '../../models';
import type { IWritableKnowledgeBox } from '../kb/kb.models';
import {
  ExternalConnection,
  ExternalConnectionCredentials,
  ISyncManager,
  Job,
  OAuthUrl,
  SyncConfiguration,
  SyncConfigurationCreate,
} from './sync.models';

export class SyncManager implements ISyncManager {
  kb: IWritableKnowledgeBox;
  nuclia: INuclia;

  constructor(kb: IWritableKnowledgeBox, nuclia: INuclia) {
    this.kb = kb;
    this.nuclia = nuclia;
  }

  createOAuthExternalConnection(provider: string): Observable<OAuthUrl> {
    return this.nuclia.rest.post<any>(`${this.kb.path}/external_connections`, { provider });
  }

  createExternalConnection(
    provider: string,
    credentials: ExternalConnectionCredentials,
  ): Observable<ExternalConnection> {
    return this.nuclia.rest.post<any>(`${this.kb.path}/external_connections`, { provider, credentials });
  }

  createConfig(config: SyncConfigurationCreate): Observable<SyncConfiguration> {
    return this.nuclia.rest.post<any>(`${this.kb.path}/sync_configs`, { ...config });
  }

  getConfigs(): Observable<SyncConfiguration[]> {
    return this.nuclia.rest.get<any>(`${this.kb.path}/sync_configs`);
  }

  getConfig(id: string): Observable<SyncConfiguration> {
    return this.nuclia.rest.get<any>(`${this.kb.path}/sync_config/${id}`);
  }

  deleteConfig(id: string): Observable<void> {
    return this.nuclia.rest.delete(`${this.kb.path}/sync_config/${id}`);
  }

  getConfigJobs(id: string): Observable<Job[]> {
    return this.nuclia.rest.get<Job[]>(`${this.kb.path}/sync_config/${id}/jobs`);
  }
}
