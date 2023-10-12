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

/** Provide access to all the Knowledge Box contents and services in read mode.
 *
 * For any Knowledge Box operation that requires write access, you need to use `WritableKnowledgeBox` instead.
 */
export class KnowledgeBox implements IKnowledgeBox {
  account: string;
  protected nuclia: INuclia;

  /** The Knowledge Box path on the regional API.
   *
   * Example: `/v1/kb/3cce4a71-9cb9-4fda-beee-8a1512616bf0`
   */
  get path(): string {
    return `/kb/${this.id}`;
  }

  /** The Knowledge Box fullpath on the regional API.
   *
   * Example: `https://europe-1.nuclia.cloud/api/v1/kb/3cce4a71-9cb9-4fda-beee-8a1512616bf0`
   */
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

  /** Returns all the NER families defined in the Knowledge Box. */
  getEntities(withEntities = false): Observable<Entities> {
    return this.nuclia.rest
      .get<{ groups: Entities }>(`${this.path}/entitiesgroups?show_entities=${withEntities}`)
      .pipe(map((res) => res.groups));
  }

  /** Returns the NER family with the given id. */
  getEntitiesGroup(groupId: string): Observable<EntitiesGroup> {
    return this.nuclia.rest.get<EntitiesGroup>(`${this.path}/entitiesgroup/${groupId}`);
  }

  getSynonyms(): Observable<Synonyms> {
    return this.nuclia.rest.get<SynonymsPayload>(`${this.path}/custom-synonyms`).pipe(map((result) => result.synonyms));
  }

  /** Returns all the labels defined in the Knowledge Box. */
  getLabels(): Observable<LabelSets> {
    return this.nuclia.rest.get<{ labelsets?: { labelset: LabelSets } }>(`${this.path}/labelsets`).pipe(
      map((res) => res?.labelsets || {}),
      catchError(() => of({})),
    );
  }

  /** Retrieves a resource from the Knowledge Box.
   * 
   * - `show` defines which properties are returned. Default takes all the following properties 
   * and may result in a large response:
   *   - `ResourceProperties.BASIC`
   *   - `ResourceProperties.ORIGIN`
   *   - `ResourceProperties.RELATIONS`
   *   - `ResourceProperties.VALUES`
   *   - `ResourceProperties.EXTRACTED`
   *   - `ResourceProperties.ERRORS`
   * 
   *  - `extracted` defines which extracted data are returned
   * (it is ignored if `ResourceProperties.EXTRACTED` is not in the returned properties). Default takes the following:
   *   - `ExtractedDataTypes.TEXT`
   *   - `ExtractedDataTypes.METADATA`
   *   - `ExtractedDataTypes.LINK`
   *   - `ExtractedDataTypes.FILE`
   * 
   *   Other possible values are `ExtractedDataTypes.LARGE_METADATA` and `ExtractedDataTypes.VECTOR` (Note: they may significantly increase the response size).
   * 
   * Example:
    ```ts
    nuclia.db
      .getKnowledgeBox()
      .pipe(switchMap((knowledgeBox) => knowledgeBox.getResource('09a94719a6444c5a9689394f6ed9baf6')))
      .subscribe((resource) => {
        console.log('resource', resource);
      });
    ```
   */
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

  /** Retrieves a generative answer for the given query.
   * 
   * The generative answer is a text that is generated chunk by chunk by the language model.
   * It is retrieved through a readable HTTP stream, so the `chat()` method returns an `Observable`
   * emitting a value each time a new chunk is available.
   * The `incomplete` attribute of the emitted value indicates if the asnwer is complete or not.
   * 
   * Example:
   ```ts
    nuclia.knowledgeBox
      .chat('where does the Little Prince live')
      .pipe(filter((answer) => !answer.incomplete))
      .subscribe((answer) => {
        console.log(answer.text);
      });
    ```
  */
  chat(
    query: string,
    context?: Chat.ContextEntry[],
    features?: Chat.Features[],
    options?: BaseSearchOptions,
  ): Observable<Chat.Answer | IErrorResponse> {
    return chat(this.nuclia, this.path, query, context, features, options);
  }

  /** Performs a find operation in the knowledge box, which is the recommended way to search for results.
   * 
   * Example:
    ```ts
    nuclia.knowledgeBox
      .find('where does the Little Prince live')
      .subscribe((searchResult) => {
        console.log('search result', searchResult);
      });
    ```
  */
  find(
    query: string,
    features: Search.Features[] = [],
    options?: SearchOptions,
  ): Observable<Search.FindResults | IErrorResponse> {
    return find(this.nuclia, this.id, this.path, query, features, options);
  }

  /** Performs a search operation in the knowledge box.
   * 
   * It is similar to `find()` but the results are not nested.
   * 
   * Example:
    ```ts
    nuclia.knowledgeBox
      .search('where does the Little Prince live', [Search.Features.PARAGRAPH])
      .subscribe((searchResult) => {
        console.log('search result', searchResult);
      });
    ```
  */
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

  /** Suggests paragraphs based on the given query. */
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

  /** Returns totals for each kind of contents stored in the Knowledge Box (resources, fields, paragraphs, vectors) */
  counters(): Observable<Counters> {
    return this.nuclia.rest.get<Counters>(`/kb/${this.id}/counters`);
  }

  /** Lists all the resources stored in the Knowledge Box. */
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

  /** Returns an ephemeral token.
   * 
   * This is useful when displaying a clickable link to a file in a private Knowledge Box
   * (the token will authorize the request even though there are no authentication headers).
   * 
   * Example:
    ```ts
    const downloadLink = `${nuclia.rest.getFullpath(filePath)}?eph-token=${nuclia.knowledgeBox.getTempToken()}`;
    ```
   */
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

/** Extends `KnowledgeBox` with all the write operations. */
export class WritableKnowledgeBox extends KnowledgeBox implements IWritableKnowledgeBox {
  /** True if the current user is an administrator of the Knowledge Box. */
  admin?: boolean;
  /** True if the current user is a contributor of the Knowledge Box. */
  contrib?: boolean;
  private _training?: Training;

  get training(): Training {
    if (!this._training) {
      this._training = new Training(this, this.nuclia);
    }
    return this._training;
  }

  /** Modifies the Knowledge Box properties.
   * 
   * Example:
    ```ts
    nuclia.db.getKnowledgeBox("my-account", "my-kb").pipe(
      switchMap((knowledgeBox) => knowledgeBox.modify({title: "My new title"}),
    ).subscribe(() => {
      console.log("knowledge box modified");
    });
    ```
  */
  modify(data: Partial<IKnowledgeBox>): Observable<void> {
    const endpoint = this.account === 'local' ? `/kb/${this.id}` : `/account/${this.account}/kb/${this.slug}`;
    return this.nuclia.rest.patch<void>(endpoint, data);
  }

  /** Publishes or unpublishes the Knowledge Box. */
  publish(published: boolean): Observable<void> {
    return this.modify({ state: published ? 'PUBLISHED' : 'PRIVATE' });
  }

  /** Deletes the Knowledge Box. */
  delete(): Observable<void> {
    const endpoint = this.account === 'local' ? `/kb/${this.id}` : `/account/${this.account}/kb/${this.slug}`;
    return this.nuclia.rest.delete(endpoint);
  }

  /** Create a new NER family. */
  createEntitiesGroup(groupId: string, group: EntitiesGroup): Observable<void> {
    return this.nuclia.rest.post<void>(`${this.path}/entitiesgroups`, { ...group, group: groupId });
  }

  /** Update a NER family. */
  updateEntitiesGroup(groupId: string, payload: UpdateEntitiesGroupPayload): Observable<void> {
    return this.nuclia.rest.patch<void>(`${this.path}/entitiesgroup/${groupId}`, payload);
  }

  /** Delete a NER family. */
  deleteEntitiesGroup(groupId: string): Observable<void> {
    return this.nuclia.rest.delete(`${this.path}/entitiesgroup/${groupId}`);
  }

  /** Create or update a label set.
   * 
   * Example:
    ```ts
    nuclia.db
      .getKnowledgeBox('my-account', 'my-kb')
      .pipe(
        switchMap((knowledgeBox) =>
          knowledgeBox.setLabelSet('status', {
            title: 'Status',
            color: '#ff0000',
            labels: [{ title: 'Major' }, { title: 'Minor' }, { title: 'Critical' }],
          }),
        ),
      )
      .subscribe(() => {
        console.log('label set set');
      });
    ```
  */
  setLabelSet(setId: string, labelSet: LabelSet): Observable<void> {
    return this.nuclia.rest.post<void>(`${this.path}/labelset/${setId}`, labelSet);
  }

  /** Delete a label set. */
  deleteLabelSet(setId: string): Observable<void> {
    return this.nuclia.rest.delete(`${this.path}/labelset/${setId}`);
  }

  setSynonyms(synonyms: Synonyms): Observable<void> {
    return this.nuclia.rest.put<void>(`${this.path}/custom-synonyms`, { synonyms });
  }

  deleteAllSynonyms(): Observable<void> {
    return this.nuclia.rest.delete(`${this.path}/custom-synonyms`);
  }

  /** Creates and indexes a new resource in the Knowledge Box. */
  createResource(resource: ICreateResource, synchronous = true): Observable<{ uuid: string }> {
    return this.nuclia.rest.post<{ uuid: string }>(
      `${this.path}/resources`,
      resource,
      undefined,
      undefined,
      synchronous,
    );
  }

  /** Creates a new link resource in the Knowledge Box more easily than using `createResource`.
   * 
   * Example:
    ```ts
    nuclia.db
      .getKnowledgeBox('my-account', 'my-kb')
      .pipe(
        switchMap((knowledgeBox) =>
          knowledgeBox.createLinkResource(
            {
              uri: 'https://en.wikipedia.org/wiki/Hedy_Lamarr',
            },
            { classifications: [{ labelset: 'Genius', label: 'Inventor' }] },
          ),
        ),
      )
      .subscribe(() => {
        console.log('resource created');
      });
    ```
  */
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

  /** Checks if a resource exists for the given slug. */
  hasResource(slug: string): Observable<boolean> {
    // it should be a HEAD request but it's not supported by the backend at the moment
    return this.nuclia.rest.get(`${this.path}/slug/${slug}`).pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }

  /**
   * Create a resource or update it if it already exists
   */
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

  /** Uploads a file to the Knowledge Box and automatically creates a new resource to store the file.
   * The resource path is returned in the `resource` property of the `UploadResult`
   * (and `field` provides the path to the `FileField`).
   * 
   * Example:
    ```ts
    nuclia.db
      .getKnowledgeBox('my-account', 'my-kb')
      .pipe(switchMap((knowledgeBox) => knowledgeBox.upload(fileInputElement.files[0])))
      .subscribe(() => {
        console.log('file uploaded');
      });
    ```
   */
  upload(file: File | FileWithMetadata, TUS?: boolean, metadata?: FileMetadata): Observable<UploadResponse>;
  upload(buffer: ArrayBuffer, TUS?: boolean, metadata?: FileMetadata): Observable<UploadResponse>;
  upload(
    data: File | FileWithMetadata | ArrayBuffer,
    TUS?: boolean,
    metadata?: FileMetadata,
  ): Observable<UploadResponse> {
    return upload(this.nuclia, `/kb/${this.id}`, data, !!TUS, metadata);
  }

  /** Uploads a list of files to the Knowledge Box. It automatically creates a new resource for each file
   * and uses the [TUS](https://tus.io/) protocol to upload the files. */
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
