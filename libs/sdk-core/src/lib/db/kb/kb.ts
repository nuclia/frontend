/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import {
  catchError,
  defer,
  map,
  Observable,
  of,
  retry,
  RetryConfig,
  shareReplay,
  switchMap,
  tap,
  throwError,
  timer,
} from 'rxjs';
import type { IErrorResponse, INuclia } from '../../models';
import { ABORT_STREAMING_REASON } from '../../rest';
import { LearningConfigurations, normalizeSchemaProperty, ResourceProperties } from '../db.models';
import { getAllNotifications, NotificationMessage, NotificationOperation, NotificationType } from '../notifications';
import {
  ExtractedDataTypes,
  ICreateResource,
  IResource,
  LinkField,
  Origin,
  Resource,
  retry429Config,
  UserMetadata,
} from '../resource';
import {
  ask,
  catalog,
  CatalogOptions,
  ChatOptions,
  find,
  predictAnswer,
  search,
  Search,
  SearchOptions,
  suggest,
} from '../search';
import { Agentic } from '../search/agentic';
import { Ask, PredictAnswerOptions } from '../search/ask.models';
import { TaskManager } from '../task';
import { Training } from '../training';
import type { UploadResponse } from '../upload';
import { batchUpload, FileMetadata, FileWithMetadata, upload, UploadStatus } from '../upload';
import { ActivityMonitor } from './activity';
import {
  Counters,
  Entities,
  EntitiesGroup,
  ExtractConfig,
  ExtractStrategies,
  FullKbUser,
  IKnowledgeBox,
  IKnowledgeBoxBase,
  IKnowledgeBoxStandalone,
  InviteKbData,
  IWritableKnowledgeBox,
  KbInvite,
  KbUserPayload,
  LabelSet,
  LabelSets,
  ProcessingStatus,
  ResourceList,
  ResourceOperationNotification,
  ResourcePagination,
  ResourceProcessingNotification,
  SearchConfig,
  SearchConfigs,
  SentenceToken,
  ServiceAccount,
  ServiceAccountCreation,
  Synonyms,
  SynonymsPayload,
} from './kb.models';

const TEMP_TOKEN_DURATION = 5 * 60 * 1000; // 5 min

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface KnowledgeBox extends IKnowledgeBox {}

/**
 * Provides access to all the Knowledge Box contents and services in read mode.
 *
 * For any Knowledge Box operation that requires write access, you need to use `WritableKnowledgeBox` instead.
 */
export class KnowledgeBox implements IKnowledgeBox {
  accountId: string;
  protected nuclia: INuclia;
  private tempTokenReplay: Observable<string> | undefined;
  private tempTokenExpiration = 0;
  private notifications?: Observable<NotificationMessage[]>;
  private notificationsController?: AbortController;

  private resourceProcessingStatus: {
    [resourceId: string]: {
      seqid: number;
      resource_title: string;
      indexedNotificationCount: number;
      sequence: NotificationType[];
      operation?: NotificationOperation;
      error?: boolean;
      ingestion_succeeded?: boolean;
      processing_errors?: boolean;
    };
  } = {};
  private resourceOperationStatus: {
    [resourceId: string]: {
      seqid: number;
      resource_title: string;
      indexedNotificationCount: number;
      sequence: NotificationType[];
      operation?: NotificationOperation;
      error?: boolean;
      ingestion_succeeded?: boolean;
      processing_errors?: boolean;
    };
  } = {};

  /**
   * The Knowledge Box path on the regional API.
   *
   * Example: `/v1/kb/3cce4a71-9cb9-4fda-beee-8a1512616bf0`
   */
  get path(): string {
    return `/kb/${this.id}`;
  }

  /**
   * The Knowledge Box fullpath on the regional API.
   *
   * Example: `https://europe-1.nuclia.cloud/api/v1/kb/3cce4a71-9cb9-4fda-beee-8a1512616bf0`
   */
  get fullpath(): string {
    return `${this.nuclia.regionalBackend}/v1/kb/${this.id}`;
  }

  constructor(nuclia: INuclia, account: string, data: IKnowledgeBoxBase | IKnowledgeBoxStandalone) {
    this.nuclia = nuclia;
    this.accountId = account;
    if ('uuid' in data) {
      this.id = data.uuid;
      this.slug = data.slug;
      this.title = data.config?.title || '';
      this.description = data.config?.description;
      this.hidden_resources_enabled = data.config?.hidden_resources_enabled;
      this.hidden_resources_hide_on_creation = data.config?.hidden_resources_hide_on_creation;
    } else {
      Object.assign(this, data);
    }
    if (!this.title && this.slug) {
      this.title = this.slug;
    }
  }

  /** Returns all the NER families defined in the Knowledge Box. */
  getEntities(): Observable<Entities> {
    return this.nuclia.rest.get<{ groups: Entities }>(`${this.path}/entitiesgroups`).pipe(map((res) => res.groups));
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

  /**
   * Retrieves a resource from the Knowledge Box.
   *
   * - `show` defines which properties are returned. Default retrieves only the basic metadata.
   * - `extracted` defines which extracted data are returned.
   *    It is ignored if `ResourceProperties.EXTRACTED` is not in the returned properties.
   *    Default is an empty array.
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
    show: ResourceProperties[] = [ResourceProperties.BASIC],
    extracted: ExtractedDataTypes[] = [],
  ): Observable<Resource> {
    return this._getResource(uuid, undefined, show, extracted);
  }

  /**
   * Retrieves a resource from the Knowledge Box with all its attached metadata and content.
   */
  getFullResource(uuid: string): Observable<Resource> {
    return this._getResource(
      uuid,
      undefined,
      [
        ResourceProperties.BASIC,
        ResourceProperties.ORIGIN,
        ResourceProperties.RELATIONS,
        ResourceProperties.VALUES,
        ResourceProperties.EXTRACTED,
        ResourceProperties.ERRORS,
        ResourceProperties.EXTRA,
        ResourceProperties.SECURITY,
      ],
      [
        ExtractedDataTypes.TEXT,
        ExtractedDataTypes.METADATA,
        ExtractedDataTypes.LINK,
        ExtractedDataTypes.FILE,
        ExtractedDataTypes.QUESTION_ANSWERS,
      ],
    );
  }

  getResourceBySlug(
    slug: string,
    show: ResourceProperties[] = [ResourceProperties.BASIC],
    extracted: ExtractedDataTypes[] = [],
  ): Observable<Resource> {
    return this._getResource(undefined, slug, show, extracted);
  }

  getFullResourceBySlug(slug: string): Observable<Resource> {
    return this._getResource(
      undefined,
      slug,
      [
        ResourceProperties.BASIC,
        ResourceProperties.ORIGIN,
        ResourceProperties.RELATIONS,
        ResourceProperties.VALUES,
        ResourceProperties.EXTRACTED,
        ResourceProperties.ERRORS,
        ResourceProperties.EXTRA,
        ResourceProperties.SECURITY,
      ],
      [
        ExtractedDataTypes.TEXT,
        ExtractedDataTypes.METADATA,
        ExtractedDataTypes.LINK,
        ExtractedDataTypes.FILE,
        ExtractedDataTypes.QUESTION_ANSWERS,
      ],
    );
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

  createAgenticRAGPipeline(steps: Agentic.Steps): Agentic.Pipeline {
    return new Agentic.Pipeline(this, steps);
  }

  /**
   * Retrieves a generative answer for the given query.
   *
   * The generative answer is a text that is generated chunk by chunk by the language model.
   * It is retrieved through a readable HTTP stream, so the `chat()` method returns an `Observable`
   * emitting a value each time a new chunk is available.
   * The `incomplete` attribute of the emitted value indicates if the asnwer is complete or not.
   *
   * Example:
   ```ts
    nuclia.knowledgeBox
      .ask('where does the Little Prince live')
      .pipe(filter((answer) => !answer.incomplete))
      .subscribe((answer) => {
        console.log(answer.text);
      });
    ```
  */
  ask(
    query: string,
    context?: Ask.ContextEntry[],
    features?: Ask.Features[],
    options?: ChatOptions,
  ): Observable<Ask.Answer | IErrorResponse>;
  ask(
    query: string,
    context?: Ask.ContextEntry[],
    features?: Ask.Features[],
    options?: ChatOptions,
    callback?: (answer: Ask.Answer | IErrorResponse) => void,
  ): Observable<null>;
  ask(
    query: string,
    context?: Ask.ContextEntry[],
    features?: Ask.Features[],
    options?: ChatOptions,
    callback?: (answer: Ask.Answer | IErrorResponse) => void,
  ): Observable<Ask.Answer | IErrorResponse> | Observable<null> {
    const askRequest = ask(this.nuclia, this.id, this.path, query, context, features, options);
    if (callback) {
      askRequest.subscribe((response) => callback(response));
      return of(null);
    }
    return askRequest;
  }

  /**
   * Performs a find operation in the Knowledge Box, which is the recommended way to search for results.
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

  /**
   * Performs a search operation in the knowledge box.
   *
   * It is similar to `find()` but the results are not nested.
   *
   * Example:
    ```ts
    nuclia.knowledgeBox
      .search('where does the Little Prince live', [Search.Features.KEYWORD])
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

  /**
   * Summarize resources.
   *
   * It reads the resources text content and return a global summary about them and one summery per resource.
   *
   * The optional `user_prompt` parameter allows you to specify a text that will be used to generate the summary,
   * and must use the `{text}` placeholder to indicate where the resource text should be inserted
   * (example: 'Make a one-line summary of the following text: {text}').
   *
   * Example:
    ```ts
    nuclia.knowledgeBox
      .summarize(['09a94719a6444c5a9689394f6ed9baf6'])
      .subscribe((summary) => {
        console.log('Summary', summary);
      });
    ```
  */
  summarize(ressourceIds: string[], user_prompt?: string, generative_model?: string): Observable<string> {
    const retryDelays = [0, 1000, 2000, 5000, 10000];
    const retryConfig: RetryConfig = {
      count: retryDelays.length,
      delay: (error, retryCount) => timer(retryDelays[retryCount - 1]),
    };
    return defer(() =>
      this.nuclia.rest.post<{ summary: string }>(`${this.path}/summarize`, {
        resources: ressourceIds,
        user_prompt,
        generative_model,
      }),
    ).pipe(
      retry(retryConfig),
      map((res) => res.summary),
    );
  }

  /**
   * Performs a tokenization of the given text.
   *
   * Example:
    ```ts
    nuclia.knowledgeBox
      .tokens('Does James Joyce live in Dublin?')
      .subscribe((tokens) => {
        console.log('tokens', tokens);
      });
    ```
  */
  tokens(text: string): Observable<SentenceToken[]> {
    return this.nuclia.rest
      .get<{ tokens: SentenceToken[] }>(`${this.path}/predict/tokens?text=${decodeURIComponent(text)}`)
      .pipe(map((res) => res.tokens));
  }

  /**
   * Performs a question answering operation
   * 
   * Example:
    ```ts
    nuclia.knowledgeBox
      .predictAnswer('Who is Eric from Toronto?'))
      .subscribe((answer) => {
        if (answer.type !== 'error') {
          console.log('answer', answer.text);
        }
      });
    ```
   */
  predictAnswer(
    question: string,
    options?: PredictAnswerOptions,
    synchronous = true,
  ): Observable<Ask.Answer | IErrorResponse> {
    return predictAnswer(this.nuclia, this.path, question, options, synchronous);
  }

  /**
   * Performs a question answering operation based on a given context.
   *
   * Example:
    ```ts
    nuclia.knowledgeBox
      .generate('Who is Eric from Toronto?', [
        'Eric is a taxi driver',
        'Eric was born in France',
        'Eric lives in Toronto',
      ]))
      .subscribe(({ answer }) => {
        console.log('answer', answer);
      });
    ```
  */
  generate(question: string, context: string[] = []): Observable<{ answer: string; cannotAnswer: boolean }> {
    return this.predictAnswer(question, { query_context: context }, true).pipe(
      map((res) =>
        res.type === 'answer' ? { answer: res.text, cannotAnswer: false } : { answer: res.detail, cannotAnswer: true },
      ),
    );
  }

  /**
   * Performs a question answering operation using a JSON schema.
   *
   * Example:
    ```ts
    nuclia.knowledgeBox
      .generateJSON(
        'Who is Eric from Toronto?',
        {
          name: 'info',
          parameters: {
            properties: {
              location: {
                title: 'Location',
                description: 'The location of the person',
                type: 'string',
              },
              name: {
                title: 'Name',
                description: 'The name of the person',
                type: 'string',
              },
            },
            required: ['name', 'location'],
          },
        },
        [
          'Eric is a taxi driver',
          'Eric was born in France',
          'Eric lives in Toronto',
        ],
      )).subscribe((answer) => {
        console.log('location', answer.answer.location);
      });
    ```
  */
  generateJSON(
    question: string,
    json_schema: object,
    context: string[] = [],
  ): Observable<{ answer: object; success: boolean }> {
    return this.predictAnswer(question, { query_context: context, json_schema }, true).pipe(
      map((res) =>
        res.type === 'answer' ? { answer: res.jsonAnswer, success: true } : { answer: {}, success: false },
      ),
    );
  }

  /**
   * Performs a question rephrasing operation.
   * It returns a rephrased question that can be used as input for the `generate()` method.
   * Example:
    ```ts
    nuclia.knowledgeBox
    .rephrase('Eric lives Toronto')
    .subscribe((rephrased) => {
      console.log('rephrased', rephrased); // Where does Eric live?
    });
    ```
  */
  rephrase(question: string, user_context?: string[], rephrase_prompt?: string): Observable<string> {
    return this.nuclia.rest
      .post<string>(`${this.path}/predict/rephrase`, { question, user_id: 'USER', user_context, rephrase_prompt })
      .pipe(map((res) => res.slice(0, -1)));
  }

  /**
   * Generates a random question about the given resource.
   * It picks an entities relation from the extracted metadata and generates a question about it.
   * It returns an empty string if no question can be generated.
   * Example:
     ```ts
      nuclia.knowledgeBox
      .getResource('09a94719a6444c5a9689394f6ed9baf6', [ResourceProperties.EXTRACTED], [ExtractedDataTypes.METADATA])
      .pipe(
        switchMap((resource) => knowledgeBox.generateRandomQuestionAboutResource(resource)),
      )
      .subscribe((question) => {
        console.log('question', question);
      });
    ```
  */
  generateRandomQuestionAboutResource(resource: Resource): Observable<string> {
    const fieldWithExtractedMetadata = resource.getFields().filter((field) => !!field.extracted?.metadata);
    if (fieldWithExtractedMetadata.length === 0) {
      return throwError(
        () =>
          'No field with extracted metadata. Make sure to call `getResource` with `show=extracted` and `extracted=metadata`',
      );
    }
    const firstFieldWithEntitiesRelations = fieldWithExtractedMetadata.find(
      (field) =>
        (
          field.extracted?.metadata?.metadata.relations?.filter(
            (rel) => rel.from?.type === 'entity' && rel.to.type === 'entity',
          ) || []
        ).length > 0,
    );
    if (!firstFieldWithEntitiesRelations) {
      return of('');
    } else {
      const relation = firstFieldWithEntitiesRelations.extracted?.metadata?.metadata.relations?.find(
        (rel) => rel.from?.type === 'entity' && rel.to.type === 'entity',
      );
      return this.rephrase(`${relation?.from?.value} ${relation?.label} ${relation?.to.value}`);
    }
  }

  catalog(query: string, options?: CatalogOptions): Observable<Search.Results | IErrorResponse> {
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

  feedback(answerId: string, good: boolean, feedback = '', text_block_id?: string): Observable<void> {
    return this.nuclia.rest.post(`${this.path}/feedback`, {
      ident: answerId,
      good,
      task: 'CHAT',
      feedback,
      text_block_id,
    });
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

  /**
   * Returns an ephemeral token.
   * Requires account id and zone to be set in the Nuclia options (except when working with a local NucliaDB instance).
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
    if (!this.tempTokenReplay || this.tempTokenExpiration < Date.now()) {
      this.tempTokenReplay = this._getTempToken().pipe(
        map((res) => res.token),
        shareReplay(1),
      );
      this.tempTokenExpiration = Date.now() + TEMP_TOKEN_DURATION;
    }
    return this.tempTokenReplay;
  }
  private _getTempToken(): Observable<{ token: string }> {
    if (!this.nuclia.options.standalone) {
      const accountId = this.nuclia.options.accountId;
      const zone = this.nuclia.options.zone;
      if (!accountId || !zone) {
        throw new Error('Account id and zone are required to get a temp token');
      }
      return this.nuclia.rest.post<{ token: string }>(
        `/account/${accountId}/kb/${this.id}/ephemeral_tokens`,
        {},
        undefined,
        undefined,
        undefined,
        zone,
      );
    } else {
      return this.nuclia.rest.get<{ token: string }>('/temp-access-token');
    }
  }

  getConfiguration(): Observable<{ [id: string]: any }> {
    return this.nuclia.rest.get<{ [id: string]: any }>(`/kb/${this.id}/configuration`);
  }

  getLearningSchema(): Observable<LearningConfigurations> {
    return this.nuclia.rest
      .get<LearningConfigurations>(`/kb/${this.id}/schema`)
      .pipe(map((config) => normalizeSchemaProperty(config)));
  }

  getUsers(): Observable<FullKbUser[]> {
    return this.nuclia.rest.get<FullKbUser[]>(
      `/account/${this.nuclia.options.accountId}/kb/${this.id}/users?include_user_detail=true`,
      undefined,
      undefined,
      this.nuclia.options.zone,
    );
  }

  getInvites(): Observable<KbInvite[]> {
    return this.nuclia.rest.get<KbInvite[]>(
      `/account/${this.nuclia.options.accountId}/kb/${this.id}/invites`,
      undefined,
      undefined,
      this.nuclia.options.zone,
    );
  }

  /**
   * Start listening to all the notifications sent by the Knowledge Box.
   */
  listenToAllNotifications(): Observable<NotificationMessage[]> {
    if (!this.notifications) {
      this.notificationsController = new AbortController();
      this.notifications = getAllNotifications(this.nuclia, this.path, this.notificationsController);
    }
    return this.notifications;
  }

  /**
   * Stop listening the notifications sent by the Knowledge Box.
   */
  stopListeningToNotifications() {
    if (this.notificationsController) {
      this.notificationsController.abort(ABORT_STREAMING_REASON);
      this.notificationsController = undefined;
      this.notifications = undefined;
    }
  }

  /**
   * Start listening to the Knowledge Box notifications, and returns the list of notifications corresponding to the different operations affecting the resources:
   * created, modified, deleted.
   * The notification contains the resource id, title, a timestamp and a flag indicating if the operation was successful or not.
   */
  listenToResourceOperationNotifications(): Observable<ResourceOperationNotification[]> {
    return this.listenToAllNotifications().pipe(
      map((notifications) => {
        notifications.forEach((message) => {
          const data = message.data;
          if (!this.resourceOperationStatus[data.resource_uuid] && message.type === 'resource_written') {
            this.resourceOperationStatus[data.resource_uuid] = {
              seqid: data.seqid,
              resource_title: data.resource_title,
              indexedNotificationCount: 0,
              sequence: [],
            };
          }
          if (this.resourceOperationStatus[data.resource_uuid]) {
            if (message.type === 'resource_indexed') {
              this.resourceOperationStatus[data.resource_uuid].indexedNotificationCount++;
            } else {
              this.resourceOperationStatus[data.resource_uuid] = {
                ...this.resourceOperationStatus[data.resource_uuid],
                ...data,
                sequence: [...this.resourceOperationStatus[data.resource_uuid].sequence, message.type],
              };
            }
          }
        });
        return Object.entries(this.resourceOperationStatus).reduce((notificationList, [resourceId, data]) => {
          if (
            !!data.operation &&
            (data.operation === 'deleted' ||
              (data.sequence.includes('resource_processed') && data.indexedNotificationCount >= 2))
          ) {
            notificationList.push({
              resourceId,
              resourceTitle: data.resource_title,
              success:
                (data.operation === 'deleted' && !data.error) ||
                (data.operation !== 'deleted' && !data.error && !data.processing_errors && !!data.ingestion_succeeded),
              timestamp: new Date().toISOString(),
              operation: data.operation,
            });
          }
          return notificationList;
        }, [] as ResourceOperationNotification[]);
      }),
      tap((notificationList) => {
        // clean up resource status when notification is sent
        notificationList.forEach((item) => delete this.resourceOperationStatus[item.resourceId]);
      }),
    );
  }

  /**
   * Start listening to the Knowledge Box notifications, and returns the list of notifications for resources which have processing completed (either successfully or not).
   * Notifications are sent anytime processing is completed, and processing is done anytime the resource is created or modified (like when a summary is added to the resource for example).
   */
  listenToProcessingNotifications(): Observable<ResourceProcessingNotification[]> {
    return this.listenToAllNotifications().pipe(
      map((notifications) => {
        notifications.forEach((message) => {
          const data = message.data;
          if (!this.resourceProcessingStatus[data.resource_uuid]) {
            this.resourceProcessingStatus[data.resource_uuid] = {
              seqid: data.seqid,
              resource_title: data.resource_title,
              indexedNotificationCount: 0,
              sequence: [],
            };
          }
          if (message.type === 'resource_indexed') {
            this.resourceProcessingStatus[data.resource_uuid].indexedNotificationCount++;
          } else {
            this.resourceProcessingStatus[data.resource_uuid] = {
              ...this.resourceProcessingStatus[data.resource_uuid],
              ...data,
              sequence: [...this.resourceProcessingStatus[data.resource_uuid].sequence, message.type],
            };
          }
        });
        return Object.entries(this.resourceProcessingStatus).reduce((processedList, [resourceId, status]) => {
          if (status.sequence.includes('resource_processed') && status.indexedNotificationCount >= 2) {
            processedList.push({
              resourceId,
              resourceTitle: status.resource_title,
              success: !status.error && !status.processing_errors && !!status.ingestion_succeeded,
              timestamp: new Date(Date.now()).toISOString(),
            });
          }
          return processedList;
        }, [] as ResourceProcessingNotification[]);
      }),
      tap((processedResources) => {
        // clean up resource status when processing is done
        processedResources.forEach((item) => delete this.resourceProcessingStatus[item.resourceId]);
      }),
    );
  }

  processingStatus(
    cursor?: string,
    scheduled?: boolean,
    limit?: number,
  ): Observable<{ cursor: string; results: ProcessingStatus[] }> {
    const queryParams = new URLSearchParams();
    if (cursor) {
      queryParams.set('cursor', cursor);
    }
    if (typeof scheduled === 'boolean') {
      queryParams.set('scheduled', `${scheduled}`);
    }
    if (typeof limit === 'number') {
      queryParams.set('limit', `${limit}`);
    }
    return this.nuclia.rest.get(`${this.path}/processing-status?${queryParams}`);
  }

  getSearchConfig(id: string): Observable<SearchConfig> {
    return this.nuclia.rest.get<SearchConfig>(`${this.path}/search_configurations/${id}`);
  }

  getSearchConfigs(): Observable<SearchConfigs> {
    return this.nuclia.rest.get<SearchConfigs>(`${this.path}/search_configurations`);
  }
}

/** Extends `KnowledgeBox` with all the write operations. */
export class WritableKnowledgeBox extends KnowledgeBox implements IWritableKnowledgeBox {
  /** True if the current user is an administrator of the Knowledge Box. */
  admin?: boolean;
  /** True if the current user is a contributor of the Knowledge Box. */
  contrib?: boolean;
  private _training?: Training;
  private _activityMonitor?: ActivityMonitor;
  private _taskManager?: TaskManager;

  /**
   * Entry point to task manager
   */
  get taskManager(): TaskManager {
    if (!this._taskManager) {
      this._taskManager = new TaskManager(this, this.nuclia);
    }
    return this._taskManager;
  }

  /**
   * @deprecated
   */
  get training(): Training {
    if (!this._training) {
      this._training = new Training(this, this.nuclia);
    }
    return this._training;
  }
  get activityMonitor(): ActivityMonitor {
    if (!this._activityMonitor) {
      this._activityMonitor = new ActivityMonitor(this, this.nuclia);
    }
    return this._activityMonitor;
  }

  /**
   * Modifies the Knowledge Box properties.
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
    const { endpoint, zone } = this.getKbEndpointAndZone();
    return this.nuclia.rest.patch<void>(endpoint, data, undefined, undefined, undefined, zone);
  }

  /** Deletes the Knowledge Box. */
  delete(): Observable<void> {
    const { endpoint, zone } = this.getKbEndpointAndZone();
    return this.nuclia.rest.delete(endpoint, undefined, undefined, zone);
  }

  protected getKbEndpointAndZone() {
    let endpoint: string;
    let zone: string | undefined;

    if (this.accountId === 'local') {
      endpoint = `/kb/${this.id}`;
    } else {
      endpoint = `/account/${this.nuclia.options.accountId}/kb/${this.id}`;
      zone = this.nuclia.options.zone;
    }

    return { endpoint, zone };
  }

  /** Publishes or unpublishes the Knowledge Box. */
  publish(published: boolean): Observable<void> {
    return this.modify({ state: published ? 'PUBLISHED' : 'PRIVATE' });
  }

  /**
   * Creates or updates a label set.
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

  /** Deletes a label set. */
  deleteLabelSet(setId: string): Observable<void> {
    return this.nuclia.rest.delete(`${this.path}/labelset/${setId}`);
  }

  /**
   * @deprecated
   * @param synonyms
   */
  setSynonyms(synonyms: Synonyms): Observable<void> {
    return this.nuclia.rest.put<void>(`${this.path}/custom-synonyms`, { synonyms });
  }

  /**
   * @deprecated
   */
  deleteAllSynonyms(): Observable<void> {
    return this.nuclia.rest.delete(`${this.path}/custom-synonyms`);
  }

  /** Creates and indexes a new resource in the Knowledge Box. */
  createResource(resource: ICreateResource, synchronous = true): Observable<{ uuid: string }> {
    return defer(() =>
      this.nuclia.rest.post<{ uuid: string }>(`${this.path}/resources`, resource, undefined, undefined, synchronous),
    ).pipe(retry(retry429Config()));
  }

  /**
   * Creates a new link resource in the Knowledge Box more easily than using `createResource`.
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
   * Creates a resource or updates it if it already exists
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

  /**
   * Uploads a file to the Knowledge Box and automatically creates a new resource to store the file.
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

  /**
   * Uploads a list of files to the Knowledge Box. It automatically creates a new resource for each file
   * and uses the [TUS](https://tus.io/) protocol to upload the files.
   */
  batchUpload(files: FileList | File[] | FileWithMetadata[]): Observable<UploadStatus> {
    return batchUpload(this.nuclia, `/kb/${this.id}`, files, false);
  }

  getServiceAccounts(): Observable<ServiceAccount[]> {
    const { endpoint, zone } = this.getKbEndpointAndZone();
    return this.nuclia.rest.get<ServiceAccount[]>(`${endpoint}/service_accounts`, undefined, undefined, zone);
  }

  createServiceAccount(data: ServiceAccountCreation): Observable<void> {
    const { endpoint, zone } = this.getKbEndpointAndZone();
    return this.nuclia.rest.post(`${endpoint}/service_accounts`, data, undefined, undefined, undefined, zone);
  }

  deleteServiceAccount(saId: string): Observable<void> {
    const { endpoint, zone } = this.getKbEndpointAndZone();
    return this.nuclia.rest.delete(`${endpoint}/service_account/${saId}`, undefined, undefined, zone);
  }

  createKey(saId: string, expires: string): Observable<{ token: string }> {
    const { endpoint, zone } = this.getKbEndpointAndZone();
    return this.nuclia.rest.post(
      `${endpoint}/service_account/${saId}/keys`,
      { expires },
      undefined,
      undefined,
      undefined,
      zone,
    );
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
    const { endpoint, zone } = this.getKbEndpointAndZone();
    return this.nuclia.rest.delete(`${endpoint}/service_account/${saId}/key/${saKeyId}`, undefined, undefined, zone);
  }

  setConfiguration(config: { [id: string]: any }): Observable<void> {
    return this.nuclia.rest.patch(`/kb/${this.id}/configuration`, config);
  }

  /**
   * Update the list of users of the Knowledge Box, providing the list of users (id and role) to add and/or update, and the list of user ids to delete.
   * @param data
   */
  updateUsers(data: KbUserPayload): Observable<void> {
    const { endpoint, zone } = this.getKbEndpointAndZone();
    return this.nuclia.rest.patch(`${endpoint}/users`, data, undefined, undefined, undefined, zone);
  }

  /**
   * Invite a user to the Knowledge Box
   * @param data
   */
  inviteToKb(data: InviteKbData): Observable<void> {
    const { endpoint, zone } = this.getKbEndpointAndZone();
    return this.nuclia.rest.post(`${endpoint}/invite`, data, undefined, undefined, undefined, zone);
  }

  deleteInvite(email: string): Observable<void> {
    const { endpoint, zone } = this.getKbEndpointAndZone();
    const encodedEmail = encodeURIComponent(email);
    return this.nuclia.rest.delete(`${endpoint}/invite?email=${encodedEmail}`, undefined, undefined, zone);
  }

  /**
   * Add an embedding model to the Knowledge box
   * @param model
   */
  addVectorset(model: string): Observable<void> {
    return this.nuclia.rest.post(`/kb/${this.id}/vectorsets/${model}`, {});
  }

  /**
   * Remove an embedding model from the Knowledge box
   * @param model
   */
  removeVectorset(model: string): Observable<void> {
    return this.nuclia.rest.delete(`/kb/${this.id}/vectorsets/${model}`);
  }

  getExtractStrategies(): Observable<ExtractStrategies> {
    return this.nuclia.rest.get<ExtractStrategies>(`${this.path}/extract_strategies`);
  }

  createExtractStrategy(config: ExtractConfig): Observable<void> {
    return this.nuclia.rest.post<void>(`${this.path}/extract_strategies`, config);
  }

  deleteExtractStrategy(id: string): Observable<void> {
    return this.nuclia.rest.delete(`${this.path}/extract_strategies/strategy/${id}`);
  }

  createSearchConfig(id: string, config: SearchConfig): Observable<void> {
    return this.nuclia.rest.post(`${this.path}/search_configurations/${id}`, config);
  }

  updateSearchConfig(id: string, config: SearchConfig): Observable<void> {
    return this.nuclia.rest.patch<void>(`${this.path}/search_configurations/${id}`, config);
  }

  deleteSearchConfig(id: string): Observable<void> {
    return this.nuclia.rest.delete(`${this.path}/search_configurations/${id}`);
  }
}
