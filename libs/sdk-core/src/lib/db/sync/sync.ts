import { Observable } from 'rxjs';
import { INuclia } from '../../models';
import type { IWritableKnowledgeBox } from '../kb/kb.models';
import {
  BrowseOptions,
  ExternalConnection,
  ExternalConnectionCredentials,
  ISyncManager,
  Job,
  JobLogsPage,
  JobPagination,
  JobsPage,
  LogFilters,
  OAuthUrl,
  StorageStructure,
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

  getExternalConnection(id: string): Observable<ExternalConnection> {
    return this.nuclia.rest.get<any>(`${this.kb.path}/external_connection/${id}`);
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

  getConfigJobs(id: string, pagination: JobPagination = {}): Observable<JobsPage> {
    const params = getURLParams(pagination);
    return this.nuclia.rest.get<JobsPage>(`${this.kb.path}/sync_config/${id}/jobs?${params.toString()}`);
  }

  getJobLogs(jobId: string, pagination: JobPagination = {}, filters: LogFilters = {}): Observable<JobLogsPage> {
    const params = getURLParams({ ...pagination, ...filters });
    return this.nuclia.rest.get<JobLogsPage>(`${this.kb.path}/sync_job/${jobId}/logs?${params.toString()}`);
  }

  syncConfig(id: string, full_sync = false): Observable<Job> {
    return this.nuclia.rest.post<Job>(`${this.kb.path}/sync_config/${id}/sync`, { full_sync });
  }

  browse(externalConnectorId: string, options: BrowseOptions): Observable<StorageStructure> {
    const endpoint = `${this.kb.path}/external_connection/${externalConnectorId}/browse?`;
    const params = getURLParams(options);
    return this.nuclia.rest.get<StorageStructure>(endpoint + params.toString());
  }
}

function getURLParams(values: { [key: string]: any }): URLSearchParams {
  const params = new URLSearchParams();
  Object.entries(values)
    .filter(([, value]) => value !== undefined)
    .forEach(([key, value]) => {
      params.append(key, String(value));
    });
  return params;
}
