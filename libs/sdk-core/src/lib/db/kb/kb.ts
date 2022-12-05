import { catchError, map, Observable, of, switchMap } from 'rxjs';
import type { Entities, EntitiesGroup, EventList, EventType, IKnowledgeBox, LabelSet, LabelSets } from './kb.models';
import {
  Counters,
  ExtractedDataTypes,
  IKnowledgeBoxCreation,
  IWritableKnowledgeBox,
  ResourceList,
  ResourcePagination,
  ResourceProperties,
  ServiceAccount,
  ServiceAccountCreation,
} from './kb.models';
import type { INuclia } from '../../models';
import type { ICreateResource, IResource, LinkField, UserMetadata } from '../resource';
import { Resource } from '../resource';
import type { UploadResponse } from '../upload';
import { batchUpload, FileMetadata, FileWithMetadata, upload, UploadStatus } from '../upload';
import type { Search, SearchOptions } from '../search';
import { search } from '../search';
import { Training } from '../training';

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
  }

  getEntities(): Observable<Entities> {
    return this.nuclia.rest.get<{ groups: Entities }>(`${this.path}/entitiesgroups`).pipe(map((res) => res.groups));
  }

  getEntitiesGroup(groupId: string): Observable<EntitiesGroup> {
    return this.nuclia.rest.get<EntitiesGroup>(`${this.path}/entitiesgroup/${groupId}`);
  }

  getLabels(): Observable<LabelSets> {
    return this.nuclia.rest
      .get<{ labelsets?: { labelset: LabelSets } }>(`${this.path}/labelsets`)
      .pipe(map((res) => res?.labelsets || {}));
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
    const path = !uuid ? `${this.path}/slug/${slug}` : `${this.path}/resource/${uuid}`;
    return this.nuclia.rest
      .get<IResource>(`${path}?${params.join('&')}`)
      .pipe(map((res) => new Resource(this.nuclia, this.id, res)));
  }

  getResourceFromData(data: IResource): Resource {
    return new Resource(this.nuclia, this.id, data);
  }

  search(query: string, features: Search.Features[] = [], options?: SearchOptions): Observable<Search.Results> {
    return search(this.nuclia, this.path, query, features, options);
  }

  suggest(query: string): Observable<Search.Suggestions> {
    const params = `query=${encodeURIComponent(query)}`;
    return this.nuclia.rest.get<Search.Suggestions | { detail: string }>(`${this.path}/suggest?${params}`).pipe(
      catchError(() => of({ error: true } as Search.Suggestions)),
      map((res) =>
        Object.keys(res).includes('detail') ? ({ error: true } as Search.Suggestions) : (res as Search.Suggestions),
      ),
    );
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
    if (!this.nuclia.options.account || !this.nuclia.options.kbSlug) {
      throw new Error('Account and KB slug are required to get a temp token');
    }
    return this.nuclia.rest
      .post<{ token: string }>(
        `/account/${this.nuclia.options.account}/kb/${this.nuclia.options.kbSlug}/ephemeral_tokens`,
        {},
      )
      .pipe(map((res) => res.token));
  }

  listActivity(type?: EventType, page?: number, size?: number): Observable<EventList> {
    const params = [type ? `type=${type}` : '', page ? `page=${page}` : '', size ? `size=${size}` : '']
      .filter((p) => p)
      .join('&');
    return this.nuclia.rest.get<EventList>(`/kb/${this.id}/activity${params ? '?' + params : ''}`);
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
    return this.nuclia.rest.patch<void>(`/account/${this.account}/kb/${this.slug}`, data);
  }

  publish(published: boolean): Observable<void> {
    return this.modify({ state: published ? 'PUBLISHED' : 'PRIVATE' });
  }

  delete(): Observable<void> {
    return this.nuclia.rest.delete(`/account/${this.account}/kb/${this.slug}`);
  }

  setEntitiesGroup(groupId: string, group: EntitiesGroup): Observable<void> {
    return this.nuclia.rest.post<void>(`${this.path}/entitiesgroup/${groupId}`, group);
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

  createResource(resource: ICreateResource, synchronous = true): Observable<{ uuid: string }> {
    return this.nuclia.rest.post<{ uuid: string }>(
      `${this.path}/resources`,
      resource,
      undefined,
      undefined,
      synchronous,
    );
  }

  createLinkResource(link: LinkField, metadata?: UserMetadata, synchronous = true): Observable<{ uuid: string }> {
    return this.createResource(
      {
        links: { link },
        usermetadata: metadata,
        title: link.uri,
        icon: 'application/stf-link',
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

  deleteKey(saId: string, saKeyId: string): Observable<void> {
    return this.nuclia.rest.delete(`/account/${this.account}/kb/${this.slug}/service_account/${saId}/key/${saKeyId}`);
  }
}
