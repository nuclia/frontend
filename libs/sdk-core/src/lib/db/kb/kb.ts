import { catchError, from, map, Observable, of, switchMap } from 'rxjs';
import type {
  ActivityDownloadList,
  Counters,
  Entities,
  EntitiesGroup,
  EventList,
  EventType,
  IKnowledgeBox,
  IKnowledgeBoxCreation,
  IWritableKnowledgeBox,
  LabelSet,
  LabelSets,
  ResourceList,
  ResourcePagination,
  ServiceAccount,
  ServiceAccountCreation,
  Synonyms,
  SynonymsPayload,
  UpdateEntitiesGroupPayload,
} from './kb.models';
import type { IErrorResponse, INuclia } from '../../models';
import type { ICreateResource, IResource, LinkField, Origin, UserMetadata } from '../resource';
import { ExtractedDataTypes, Resource } from '../resource';
import type { UploadResponse } from '../upload';
import { batchUpload, FileMetadata, FileWithMetadata, upload, UploadStatus } from '../upload';
import type { BaseSearchOptions, Chat } from '../search';
import { catalog, chat, find, Search, search, SearchOptions, suggest } from '../search';
import { Training } from '../training';
import { ResourceProperties } from '../db.models'; // eslint-disable-next-line @typescript-eslint/no-empty-interface

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface KnowledgeBox extends IKnowledgeBox {}
export class KnowledgeBox implements IKnowledgeBox {
  account: string;
  protected nuclia: INuclia;

  get path(): string {
    return `/kb/${this.id}`;
  }

  get fullpath(): string {
    return `${this.nuclia.regionalBackend}/v1/kb/${this.id}`;
  }

  constructor(nuclia: INuclia, account: string, data: IKnowledgeBoxCreation) {
    this.nuclia = nuclia;
    this.account = account;
    Object.assign(this, data);
    if (!data.id && data.uuid) {
      this.id = data.uuid;
    }
    if (!data.title && data.slug) {
      this.title = data.slug;
    }
  }

  getEntities(withEntities = false): Observable<Entities> {
    return this.nuclia.rest
      .get<{ groups: Entities }>(`${this.path}/entitiesgroups?show_entities=${withEntities}`)
      .pipe(map((res) => res.groups));
  }

  getEntitiesGroup(groupId: string): Observable<EntitiesGroup> {
    return this.nuclia.rest.get<EntitiesGroup>(`${this.path}/entitiesgroup/${groupId}`);
  }

  getSynonyms(): Observable<Synonyms> {
    return this.nuclia.rest.get<SynonymsPayload>(`${this.path}/custom-synonyms`).pipe(map((result) => result.synonyms));
  }

  getLabels(): Observable<LabelSets> {
    return this.nuclia.rest.get<{ labelsets?: { labelset: LabelSets } }>(`${this.path}/labelsets`).pipe(
      map((res) => res?.labelsets || {}),
      catchError(() => of({})),
    );
  }

  getResource(
    uuid: string,
    show: ResourceProperties[] = [
      ResourceProperties.BASIC,
      ResourceProperties.ORIGIN,
      ResourceProperties.RELATIONS,
      ResourceProperties.VALUES,
      ResourceProperties.EXTRACTED,
      ResourceProperties.ERRORS,
    ],
    extracted: ExtractedDataTypes[] = [
      ExtractedDataTypes.TEXT,
      ExtractedDataTypes.METADATA,
      ExtractedDataTypes.LINK,
      ExtractedDataTypes.FILE,
    ],
  ): Observable<Resource> {
    return this._getResource(uuid, undefined, show, extracted);
  }

  getResourceBySlug(
    slug: string,
    show: ResourceProperties[] = [
      ResourceProperties.BASIC,
      ResourceProperties.ORIGIN,
      ResourceProperties.RELATIONS,
      ResourceProperties.VALUES,
      ResourceProperties.EXTRACTED,
      ResourceProperties.ERRORS,
    ],
    extracted: ExtractedDataTypes[] = [
      ExtractedDataTypes.TEXT,
      ExtractedDataTypes.METADATA,
      ExtractedDataTypes.LINK,
      ExtractedDataTypes.FILE,
    ],
  ): Observable<Resource> {
    return this._getResource(undefined, slug, show, extracted);
  }

  private _getResource(
    uuid?: string,
    slug?: string,
    show: ResourceProperties[] = [
      ResourceProperties.BASIC,
      ResourceProperties.ORIGIN,
      ResourceProperties.RELATIONS,
      ResourceProperties.VALUES,
      ResourceProperties.EXTRACTED,
      ResourceProperties.ERRORS,
    ],
    extracted: ExtractedDataTypes[] = [
      ExtractedDataTypes.TEXT,
      ExtractedDataTypes.METADATA,
      ExtractedDataTypes.LINK,
      ExtractedDataTypes.FILE,
    ],
  ): Observable<Resource> {
    const params = [...show.map((s) => `show=${s}`), ...extracted.map((e) => `extracted=${e}`)];
    return this.nuclia.rest
      .get<IResource>(`${this._getPath(uuid, slug)}?${params.join('&')}`)
      .pipe(map((res) => new Resource(this.nuclia, this.id, res)));
  }

  private _getPath(uuid?: string, slug?: string): string {
    return !uuid ? `${this.path}/slug/${slug}` : `${this.path}/resource/${uuid}`;
  }

  getResourceFromData(data: IResource): Resource {
    return new Resource(this.nuclia, this.id, data);
  }

  chat(
    query: string,
    context?: Chat.ContextEntry[],
    features?: Chat.Features[],
    options?: BaseSearchOptions,
  ): Observable<Chat.Answer | IErrorResponse> {
    return chat(this.nuclia, this.path, query, context, features, options);
  }

  find(
    query: string,
    features: Search.Features[] = [],
    options?: SearchOptions,
  ): Observable<Search.FindResults | IErrorResponse> {
    return find(this.nuclia, this.id, this.path, query, features, options);
  }

  search(
    query: string,
    features: Search.Features[] = [],
    options?: SearchOptions,
  ): Observable<Search.Results | IErrorResponse> {
    return search(this.nuclia, this.id, this.path, query, features, options);
  }

  catalog(query: string, options?: SearchOptions): Observable<Search.Results | IErrorResponse> {
    return catalog(this.nuclia, this.id, query, options);
  }

  suggest(
    query: string,
    inTitleOnly = false,
    features: Search.SuggestionFeatures[] = [],
  ): Observable<Search.Suggestions | IErrorResponse> {
    return suggest(this.nuclia, this.id, this.path, query, inTitleOnly, features);
  }

  feedback(answerId: string, good: boolean): Observable<void> {
    return this.nuclia.rest.post(`${this.path}/feedback`, { ident: answerId, good, task: 'CHAT', feedback: '' });
  }

  counters(): Observable<Counters> {
    return this.nuclia.rest.get<Counters>(`/kb/${this.id}/counters`);
  }

  listResources(page?: number, size?: number): Observable<ResourceList> {
    const params = [page ? `page=${page}` : '', size ? `size=${size}` : ''].filter((p) => p).join('&');
    return this.nuclia.rest
      .get<{
        resources: IResource[];
        pagination: ResourcePagination;
      }>(`/kb/${this.id}/resources${params ? '?' + params : ''}`)
      .pipe(
        map((res) => ({
          resources: res.resources.map((resource) => new Resource(this.nuclia, this.id, resource)),
          pagination: res.pagination,
        })),
      );
  }

  getTempToken(): Observable<string> {
    const account = this.account || this.nuclia.options.account;
    const kbSlug = this.slug || this.nuclia.options.kbSlug;
    if (!this.nuclia.options.standalone) {
      if (!account || !kbSlug) {
        throw new Error('Account and KB slug are required to get a temp token');
      }
      return this.nuclia.rest
        .post<{ token: string }>(`/account/${account}/kb/${kbSlug}/ephemeral_tokens`, {})
        .pipe(map((res) => res.token));
    } else {
      return this.nuclia.rest.get<{ token: string }>('/temp-access-token').pipe(map((res) => res.token));
    }
  }

  listActivity(type?: EventType, page?: number, size?: number): Observable<EventList> {
    const params = [type ? `type=${type}` : '', page ? `page=${page}` : '', size ? `size=${size}` : '']
      .filter((p) => p)
      .join('&');
    return this.nuclia.rest.get<EventList>(`/kb/${this.id}/activity${params ? '?' + params : ''}`);
  }

  listActivityDownloads(type: EventType): Observable<ActivityDownloadList> {
    return this.nuclia.rest.get<ActivityDownloadList>(`/kb/${this.id}/activity/downloads?type=${type}`);
  }

  downloadActivity(type: EventType, month: string): Observable<Blob> {
    return this.nuclia.rest
      .get<Response>(`/kb/${this.id}/activity/download?type=${type}&month=${month}`, {}, true)
      .pipe(switchMap((res) => from(res.blob())));
  }

  getConfiguration(): Observable<{ [id: string]: any }> {
    return this.nuclia.rest.get<{ [id: string]: any }>(`/kb/${this.id}/configuration`);
  }
}

export class WritableKnowledgeBox extends KnowledgeBox implements IWritableKnowledgeBox {
  admin?: boolean;
  contrib?: boolean;
  private _training?: Training;

  get training(): Training {
    if (!this._training) {
      this._training = new Training(this, this.nuclia);
    }
    return this._training;
  }

  modify(data: Partial<IKnowledgeBox>): Observable<void> {
    const endpoint = this.account === 'local' ? `/kb/${this.id}` : `/account/${this.account}/kb/${this.slug}`;
    return this.nuclia.rest.patch<void>(endpoint, data);
  }

  publish(published: boolean): Observable<void> {
    return this.modify({ state: published ? 'PUBLISHED' : 'PRIVATE' });
  }

  delete(): Observable<void> {
    return this.nuclia.rest.delete(`/account/${this.account}/kb/${this.slug}`);
  }

  createEntitiesGroup(groupId: string, group: EntitiesGroup): Observable<void> {
    return this.nuclia.rest.post<void>(`${this.path}/entitiesgroups`, { ...group, group: groupId });
  }

  updateEntitiesGroup(groupId: string, payload: UpdateEntitiesGroupPayload): Observable<void> {
    return this.nuclia.rest.patch<void>(`${this.path}/entitiesgroup/${groupId}`, payload);
  }

  deleteEntitiesGroup(groupId: string): Observable<void> {
    return this.nuclia.rest.delete(`${this.path}/entitiesgroup/${groupId}`);
  }

  setLabelSet(setId: string, labelSet: LabelSet): Observable<void> {
    return this.nuclia.rest.post<void>(`${this.path}/labelset/${setId}`, labelSet);
  }

  deleteLabelSet(setId: string): Observable<void> {
    return this.nuclia.rest.delete(`${this.path}/labelset/${setId}`);
  }

  setSynonyms(synonyms: Synonyms): Observable<void> {
    return this.nuclia.rest.put<void>(`${this.path}/custom-synonyms`, { synonyms });
  }

  deleteAllSynonyms(): Observable<void> {
    return this.nuclia.rest.delete(`${this.path}/custom-synonyms`);
  }

  createResource(resource: ICreateResource, synchronous = true): Observable<{ uuid: string }> {
    return this.nuclia.rest.post<{ uuid: string }>(
      `${this.path}/resources`,
      resource,
      undefined,
      undefined,
      synchronous,
    );
  }

  createLinkResource(
    link: LinkField,
    metadata?: UserMetadata,
    synchronous = true,
    origin?: Origin,
  ): Observable<{ uuid: string }> {
    return this.createResource(
      {
        links: { link },
        usermetadata: metadata,
        title: link.uri,
        icon: 'application/stf-link',
        ...(origin ? { origin } : {}),
      },
      synchronous,
    );
  }

  hasResource(slug: string): Observable<boolean> {
    // it should be a HEAD request but it's not supported by the backend at the moment
    return this.nuclia.rest.get(`${this.path}/slug/${slug}`).pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }

  createOrUpdateResource(data: ICreateResource, synchronous = true): Observable<{ uuid: string } | void> {
    const resourceExists = data.slug ? this.hasResource(data.slug) : of(false);
    return resourceExists.pipe(
      switchMap((exists) =>
        exists
          ? this.getResourceFromData({ id: '', slug: data.slug }).modify(data, synchronous)
          : this.createResource(data, synchronous),
      ),
    );
  }

  upload(file: File | FileWithMetadata, TUS?: boolean, metadata?: FileMetadata): Observable<UploadResponse>;
  upload(buffer: ArrayBuffer, TUS?: boolean, metadata?: FileMetadata): Observable<UploadResponse>;
  upload(
    data: File | FileWithMetadata | ArrayBuffer,
    TUS?: boolean,
    metadata?: FileMetadata,
  ): Observable<UploadResponse> {
    return upload(this.nuclia, `/kb/${this.id}`, data, !!TUS, metadata);
  }

  batchUpload(files: FileList | File[] | FileWithMetadata[]): Observable<UploadStatus> {
    return batchUpload(this.nuclia, `/kb/${this.id}`, files, false);
  }

  getServiceAccounts(): Observable<ServiceAccount[]> {
    return this.nuclia.rest.get<ServiceAccount[]>(`/account/${this.account}/kb/${this.slug}/service_accounts`);
  }

  createServiceAccount(data: ServiceAccountCreation): Observable<void> {
    return this.nuclia.rest.post(`/account/${this.account}/kb/${this.slug}/service_accounts`, data);
  }

  deleteServiceAccount(saId: string): Observable<void> {
    return this.nuclia.rest.delete(`/account/${this.account}/kb/${this.slug}/service_account/${saId}`);
  }

  createKey(saId: string, expires: string): Observable<{ token: string }> {
    return this.nuclia.rest.post(`/account/${this.account}/kb/${this.slug}/service_account/${saId}/keys`, { expires });
  }

  createKeyForService(data: ServiceAccountCreation, expires: string): Observable<{ token: string }> {
    return this.getServiceAccounts().pipe(
      switchMap((services) => {
        const existing = services.find((service) => service.title === data.title && service.role === data.role);
        return existing
          ? of(existing)
          : this.createServiceAccount(data).pipe(
              switchMap(() => this.getServiceAccounts()),
              map((updatedServices) =>
                updatedServices.find((service) => service.title === data.title && service.role === data.role),
              ),
            );
      }),
      switchMap((service) => (service ? this.createKey(service.id, expires) : of({ token: '' }))),
    );
  }

  deleteKey(saId: string, saKeyId: string): Observable<void> {
    return this.nuclia.rest.delete(`/account/${this.account}/kb/${this.slug}/service_account/${saId}/key/${saKeyId}`);
  }

  setConfiguration(config: { [id: string]: any }): Observable<void> {
    return this.nuclia.rest.patch(`/kb/${this.id}/configuration`, config);
  }
}
