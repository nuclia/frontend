import type {
  ChatOptions,
  FieldFullId,
  FieldMetadata,
  HistoryEntry,
  IErrorResponse,
  IEvents,
  IResource,
  KBStates,
  LabelSets,
  NucliaOptions,
  PredictAnswerOptions,
  Reranker,
  Resource,
  ResourceField,
  Routing,
  SearchOptions,
  SuggestOptions,
} from '@nuclia/core';
import {
  AnswerOperation,
  Ask,
  ExtractedDataTypes,
  getFilterFromLabelSet,
  MIME_FACETS,
  Nuclia,
  ResourceFieldProperties,
  ResourceProperties,
  Search,
} from '@nuclia/core';
import { filter, forkJoin, from, map, merge, Observable, of, switchMap, take, tap } from 'rxjs';
import { _, translateInstant } from './i18n';
import type { EntityGroup, WidgetOptions } from './models';
import { reset } from './reset';
import { chatError, disclaimer, hideAnswer } from './stores/answers.store';
import { agenticStep } from './stores/widget.store';
import {
  displayedMetadata,
  searchConfigId,
  noScroll,
  searchError,
  searchOptions,
  showAttachedImages,
  routedConfig,
} from './stores/search.store';
import { suggestionError } from './stores/suggestions.store';
import { hasViewerSearchError } from './stores/viewer.store';
import { initTracking, logEvent } from './tracking';
import { downloadAsJSON, entitiesDefaultColor, generatedEntitiesColor, withCache } from './utils';

const DEFAULT_SEARCH_MODE = [Search.Features.KEYWORD, Search.Features.SEMANTIC];
const DEFAULT_CHAT_MODE = [Ask.Features.KEYWORD, Ask.Features.SEMANTIC];
const DEFAULT_SEARCH_OPTIONS: Partial<SearchOptions> = {};
// IMPORTANT! do not initialise those options outside initNuclia,
// otherwise options might be kept in memory when using the widget generator
let nucliaApi: Nuclia | null;
let STATE: KBStates;
let SEARCH_MODE: Search.Features[];
let CHAT_MODE: Ask.Features[];
let SEARCH_OPTIONS: Partial<SearchOptions>;
let SUGGEST_MODE: Search.SuggestionFeatures[];
let prompt: string | undefined = undefined;
let systemPrompt: string | undefined = undefined;
let generative_model: string | undefined = undefined;
let vectorset: string | undefined = undefined;
let CITATIONS: boolean | 'none' | 'default' | 'llm_footnotes' = false;
let REPHRASE = false;
let REPHRASE_PROMPT: string | undefined = undefined;
let ASK_TO_RESOURCE = '';
let MAX_TOKENS: number | { context?: number; answer?: number } | undefined = undefined;
let MAX_PARAGRAPHS: number | undefined = undefined;
let NOT_ENOUGH_DATA_MESSAGE = '';
let NO_CHAT_HISTORY = false;
let DEBUG = false;
let HIGHLIGHT = false;
let SHOW_HIDDEN = false;
let SHOW_ATTACHED_IMAGES = false;
let AUDIT_METADATA: { [key: string]: string } | undefined = undefined;
let RERANKER: Reranker | undefined = undefined;
let CITATION_THRESHOLD: number | undefined = undefined;
let RRF_BOOSTING: number | undefined = undefined;
let SECURITY_GROUPS: string[] | undefined;
const ASK_SHOW: ResourceProperties[] = [ResourceProperties.BASIC, ResourceProperties.VALUES, ResourceProperties.ORIGIN];

const _applySearchModeOptions = (widgetOptions: WidgetOptions) => {
  if (widgetOptions.fuzzyOnly) {
    SEARCH_MODE = [Search.Features.KEYWORD];
  }
  if (widgetOptions.features?.relations && !SEARCH_MODE.includes(Search.Features.RELATIONS)) {
    SEARCH_MODE.push(Search.Features.RELATIONS);
    CHAT_MODE.push(Ask.Features.RELATIONS);
  }
  if (widgetOptions.features?.noBM25forChat || widgetOptions.features?.semanticOnly) {
    CHAT_MODE = CHAT_MODE.filter((feature) => feature !== Ask.Features.KEYWORD);
  }
  if (widgetOptions.features?.semanticOnly) {
    SEARCH_MODE = SEARCH_MODE.filter((feature) => feature !== Search.Features.KEYWORD);
  }
  if (widgetOptions.features?.suggestions) {
    SUGGEST_MODE.push(Search.SuggestionFeatures.PARAGRAPH);
  }
  if (widgetOptions.features?.autocompleteFromNERs) {
    SUGGEST_MODE.push(Search.SuggestionFeatures.ENTITIES);
  }
};

const _applyWidgetSearchOptions = (widgetOptions: WidgetOptions) => {
  if (widgetOptions.features?.showHidden) {
    SEARCH_OPTIONS.show_hidden = true;
  }
  if (widgetOptions.rrf_boosting) {
    SEARCH_OPTIONS.rank_fusion = { name: 'rrf', boosting: { semantic: widgetOptions.rrf_boosting } };
  }
  if (RERANKER) {
    SEARCH_OPTIONS.reranker = RERANKER;
  }
  try {
    const metadata = widgetOptions.audit_metadata ? JSON.parse(widgetOptions.audit_metadata) : undefined;
    AUDIT_METADATA = metadata;
    SEARCH_OPTIONS.audit_metadata = metadata;
  } catch (e) {
    console.error('Invalid audit metadata', e);
  }
  if (REPHRASE && REPHRASE_PROMPT) {
    SEARCH_OPTIONS.rephrase_prompt = REPHRASE_PROMPT;
  }
  if (MAX_PARAGRAPHS) {
    SEARCH_OPTIONS.top_k = MAX_PARAGRAPHS;
  }
  if (SECURITY_GROUPS) {
    SEARCH_OPTIONS.security = { groups: SECURITY_GROUPS };
  }
};

export const initNuclia = (
  options: NucliaOptions,
  state: KBStates,
  widgetOptions: WidgetOptions,
  noTracking?: boolean,
) => {
  SEARCH_MODE = [...DEFAULT_SEARCH_MODE];
  CHAT_MODE = [...DEFAULT_CHAT_MODE];
  SEARCH_OPTIONS = { ...DEFAULT_SEARCH_OPTIONS };
  SUGGEST_MODE = [];
  prompt = undefined;
  systemPrompt = undefined;
  generative_model = undefined;

  if (nucliaApi) {
    console.error('Cannot exist more than one Nuclia widget at the same time. Cancelling the first instance.');
    resetNuclia();
  }
  CITATIONS = widgetOptions.features?.llmCitations ? 'llm_footnotes' : !!widgetOptions.features?.citations;
  HIGHLIGHT = !!widgetOptions.features?.highlight;
  REPHRASE = !!widgetOptions.features?.rephrase;
  REPHRASE_PROMPT = widgetOptions.rephrase_prompt;
  ASK_TO_RESOURCE = widgetOptions.ask_to_resource || '';
  NO_CHAT_HISTORY = !!widgetOptions.features?.noChatHistory;
  DEBUG = !!widgetOptions.features?.debug;
  SHOW_HIDDEN = !!widgetOptions.features?.showHidden;
  RERANKER = widgetOptions.reranker;
  MAX_TOKENS = widgetOptions.max_output_tokens
    ? { context: widgetOptions.max_tokens, answer: widgetOptions.max_output_tokens }
    : widgetOptions.max_tokens;
  MAX_PARAGRAPHS = widgetOptions.max_paragraphs || undefined;
  SECURITY_GROUPS = (widgetOptions.security_groups?.length || 0) > 0 ? widgetOptions.security_groups : undefined;
  CITATION_THRESHOLD = widgetOptions.citation_threshold;
  RRF_BOOSTING = widgetOptions.rrf_boosting;

  if (widgetOptions.not_enough_data_message) {
    NOT_ENOUGH_DATA_MESSAGE = widgetOptions.not_enough_data_message;
  }
  if (widgetOptions.features?.hideAnswer) {
    hideAnswer.set(true);
  }
  if (widgetOptions.copy_disclaimer) {
    disclaimer.set(widgetOptions.copy_disclaimer);
  }
  if (widgetOptions.metadata) {
    displayedMetadata.set(widgetOptions.metadata);
    if (widgetOptions.metadata.includes('extra:')) {
      ASK_SHOW.push(ResourceProperties.EXTRA);
    }
  }

  _applySearchModeOptions(widgetOptions);
  _applyWidgetSearchOptions(widgetOptions);

  SHOW_ATTACHED_IMAGES = !!widgetOptions.features?.showAttachedImages;
  showAttachedImages.set(SHOW_ATTACHED_IMAGES);
  if (widgetOptions.features?.noScroll) {
    noScroll.set(true);
  }

  nucliaApi = new Nuclia(options);
  if (!noTracking) {
    initTracking(nucliaApi.options.knowledgeBox || 'kb not defined');
    logEvent('init', {
      widget_features: Object.entries(widgetOptions.features || {})
        .filter(([, value]) => !!value)
        .map(([key]) => key)
        .join(','),
    });
  }

  searchOptions.set({ highlight: HIGHLIGHT, rephrase: REPHRASE });
  prompt = widgetOptions.prompt;
  systemPrompt = widgetOptions.system_prompt;
  generative_model = widgetOptions.generative_model;
  vectorset = widgetOptions.vectorset;
  if (vectorset) {
    SEARCH_OPTIONS.vectorset = vectorset;
  }

  STATE = state;
  nucliaApi.events?.log('widgetOptions', widgetOptions);

  return nucliaApi;
};

export const resetNuclia = () => {
  nucliaApi = null;
  SEARCH_MODE = [...DEFAULT_SEARCH_MODE];
  CHAT_MODE = [...DEFAULT_CHAT_MODE];
  SUGGEST_MODE = [];
  reset.next();
};

export const find = (query: string, options: SearchOptions): Observable<Search.FindResults> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return searchConfigId.pipe(
    take(1),
    switchMap((search_configuration) =>
      nucliaApi!.knowledgeBox.find(query, SEARCH_MODE, { ...SEARCH_OPTIONS, search_configuration, ...options }),
    ),
    filter((res) => {
      if (res.type === 'error') {
        searchError.set(res);
      }
      return res.type === 'findResults' || res.status === 206;
    }),
    map((res) => (res.type === 'error' ? res.body : res) as Search.FindResults),
  );
};

export const getAnswer = (
  query: string,
  chat?: Ask.Entry[],
  options?: ChatOptions,
  searchConfigOverride?: string,
): Observable<Ask.Answer | IErrorResponse> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  const context = NO_CHAT_HISTORY
    ? undefined
    : chat?.reduce((acc, curr) => {
        acc.push(
          { author: Ask.Author.USER, text: curr.question },
          { author: Ask.Author.NUCLIA, text: curr.answer.text },
        );
        return acc;
      }, [] as Ask.ContextEntry[]);

  const defaultOptions: ChatOptions = {
    highlight: HIGHLIGHT,
    show: ASK_SHOW,
    generative_model,
    vectorset,
    citations: CITATIONS,
    rephrase: REPHRASE,
    max_tokens: MAX_TOKENS,
    top_k: MAX_PARAGRAPHS,
    debug: DEBUG,
    show_hidden: SHOW_HIDDEN,
    audit_metadata: AUDIT_METADATA,
    reranker: RERANKER,
    citation_threshold: CITATION_THRESHOLD,
    rank_fusion: RRF_BOOSTING ? { name: 'rrf', boosting: { semantic: RRF_BOOSTING } } : undefined,
    security: SECURITY_GROUPS ? { groups: SECURITY_GROUPS } : undefined,
  };
  if (prompt || systemPrompt || REPHRASE_PROMPT) {
    defaultOptions.prompt = {
      user: prompt || undefined,
      system: systemPrompt || undefined,
      rephrase: REPHRASE_PROMPT || undefined,
    };
  }
  if (DEBUG) {
    defaultOptions.show_consumption = true;
  }
  if (searchConfigOverride) {
    options = { show: ASK_SHOW, search_configuration: searchConfigOverride };
  } else {
    options = options ? { ...defaultOptions, ...options } : defaultOptions;
  }
  if (ASK_TO_RESOURCE) {
    return nucliaApi.knowledgeBox
      .getResourceFromData({ id: '', slug: ASK_TO_RESOURCE })
      .ask(query, context, CHAT_MODE, options);
  } else {
    return nucliaApi.knowledgeBox.ask(query, context, CHAT_MODE, options);
  }
};

export const getAnswerWithoutRAG = (
  question: string,
  chat?: Ask.Entry[],
  options?: ChatOptions,
): Observable<Ask.Answer | IErrorResponse> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }

  const context = NO_CHAT_HISTORY
    ? undefined
    : chat?.reduce((acc, curr) => {
        acc.push(
          { author: Ask.Author.USER, text: curr.question },
          { author: Ask.Author.NUCLIA, text: curr.answer.text },
        );
        return acc;
      }, [] as Ask.ContextEntry[]);

  const predictOptions: PredictAnswerOptions = {
    generative_model: options?.generative_model || generative_model || undefined,
    user_prompt: { prompt: '{question}' },
    system: systemPrompt || undefined,
    retrieval: false,
    chat_history: context && context.length > 0 ? context : undefined,
    max_tokens: typeof MAX_TOKENS === 'number' ? MAX_TOKENS : MAX_TOKENS?.answer,
    prefer_markdown: options?.prefer_markdown,
    json_schema: options?.answer_json_schema,
    reasoning: options?.reasoning,
  };
  return nucliaApi.knowledgeBox.predictAnswer(question, predictOptions, false);
};

/**
 * Ask a question via the WebSocket agentic pipeline.
 * Maps `AragResponse` messages from the WS stream to the `Ask.Answer` shape so they
 * can be consumed by the existing chat state without UI changes.
 *
 * Streaming chunks accumulate progressively; a final complete answer is emitted with
 * `incomplete: false` when the pipeline finishes.
 */
export const getAgenticAnswer = (
  question: string,
  configId: string,
  keepOpen = false,
  chatHistory?: HistoryEntry[],
): Observable<Ask.Answer | IErrorResponse> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }

  return searchConfigId.pipe(
    take(1),
    switchMap((searchConfig) => {
      let accumulatedText = '';

      return nucliaApi!.knowledgeBox
        .asViaWS(configId, question, keepOpen, searchConfig || undefined, SECURITY_GROUPS, chatHistory)
        .pipe(
          map((response): Ask.Answer | IErrorResponse => {
            if (response.type === 'error') {
              return response;
            }

            const aragAnswer = response.answer;

            if (aragAnswer.step?.title) {
              agenticStep.set({ title: aragAnswer.step.title, value: aragAnswer.step.value });
            }

            if (aragAnswer.streaming_response_chunk) {
              agenticStep.set(null);
              accumulatedText += aragAnswer.streaming_response_chunk.text;
              return {
                type: 'answer',
                text: accumulatedText,
                incomplete: !aragAnswer.streaming_response_chunk.last,
                id: '',
              } as Ask.Answer;
            }

            if (aragAnswer.answer) {
              accumulatedText = aragAnswer.answer;
            }

            const isDone = aragAnswer.operation === AnswerOperation.done;
            if (isDone) agenticStep.set(null);
            return {
              type: 'answer',
              text: accumulatedText,
              incomplete: !isDone,
              id: '',
            } as Ask.Answer;
          }),
        );
    }),
  );
};

export const sendFeedback = (answerId: string, approved: boolean, comment?: string, textBlockId?: string) => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return nucliaApi.knowledgeBox.feedback(answerId, approved, comment, textBlockId);
};

export const searchInResource = (
  query: string,
  resource: IResource,
  options: SearchOptions,
  features: Search.ResourceFeatures[] = [Search.ResourceFeatures.KEYWORD],
): Observable<Search.FindResults> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return nucliaApi.knowledgeBox
    .getResourceFromData(resource)
    .find(query, features, { ...options, ...DEFAULT_SEARCH_OPTIONS })
    .pipe(
      filter((res) => {
        if (res.type === 'error') {
          hasViewerSearchError.set(true);
        }
        return res.type === 'findResults';
      }),
      map((res) => res as Search.FindResults),
    );
};

export const suggest = (query: string) => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  const options: SuggestOptions = {
    security: SECURITY_GROUPS ? { groups: SECURITY_GROUPS } : undefined,
  };
  return nucliaApi.knowledgeBox.suggest(query, true, SUGGEST_MODE, options).pipe(
    filter((res) => {
      if (res.type === 'error') {
        suggestionError.set(res);
      }
      return res.type === 'suggestions';
    }),
  );
};

export const getResource = (uid: string): Observable<Resource> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return merge(
    getResourceById(uid, [ResourceProperties.BASIC, ResourceProperties.ORIGIN]),
    getResourceById(uid, [
      ResourceProperties.BASIC,
      ResourceProperties.BASIC,
      ResourceProperties.ORIGIN,
      ResourceProperties.RELATIONS,
      ResourceProperties.VALUES,
      ResourceProperties.EXTRACTED,
      ResourceProperties.ERRORS,
    ]),
  );
};

export const getResourceById = (uid: string, show: ResourceProperties[]): Observable<Resource> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return nucliaApi.knowledgeBox.getResource(uid, show, [
    ExtractedDataTypes.TEXT,
    ExtractedDataTypes.METADATA,
    ExtractedDataTypes.LINK,
    ExtractedDataTypes.FILE,
  ]);
};

export function getResourceField(fullFieldId: FieldFullId, valueOnly = false, page = 1): Observable<ResourceField> {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return nucliaApi.knowledgeBox
    .getResourceFromData({ id: fullFieldId.resourceId })
    .getField(
      fullFieldId.field_type,
      fullFieldId.field_id,
      valueOnly ? [ResourceFieldProperties.VALUE] : [ResourceFieldProperties.VALUE, ResourceFieldProperties.EXTRACTED],
      undefined,
      page,
    );
}

export function getResourceMetadata(fullFieldId: FieldFullId): Observable<FieldMetadata | undefined> {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return nucliaApi.knowledgeBox
    .getResourceFromData({ id: fullFieldId.resourceId })
    .getField(
      fullFieldId.field_type,
      fullFieldId.field_id,
      [ResourceFieldProperties.EXTRACTED],
      [ExtractedDataTypes.METADATA],
    )
    .pipe(map((data) => data.extracted?.metadata?.metadata));
}

let _entities: EntityGroup[] | undefined = undefined;
export const getEntities = (): Observable<EntityGroup[]> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  if (_entities) {
    return of(_entities);
  } else {
    return forkJoin([nucliaApi.knowledgeBox.getEntities(), _.pipe(take(1))]).pipe(
      map(([entityMap, translate]) =>
        Object.entries(entityMap)
          .map(([groupId, group]) => ({
            id: groupId,
            title:
              group.title ||
              (generatedEntitiesColor[groupId]
                ? translateInstant(`entities.${groupId.toLowerCase()}`)
                : groupId.toLocaleLowerCase()),
            color: group.color || generatedEntitiesColor[groupId] || entitiesDefaultColor,
            entities: undefined,
            custom: group.custom,
          }))
          .sort((a, b) => translate(a.title).localeCompare(translate(b.title))),
      ),
      tap((entities) => (_entities = entities || [])),
    );
  }
};

export const getFamilyEntities = (familyId: string): Observable<string[]> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return nucliaApi.knowledgeBox.getEntitiesGroup(familyId).pipe(
    map((family) =>
      Object.entries(family.entities)
        .map(([, entity]) => entity.value)
        .sort((a, b) => a.localeCompare(b)),
    ),
  );
};

export const getLabelSets = (): Observable<LabelSets> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return withCache<LabelSets>(() => nucliaApi!.knowledgeBox.getLabels(), nucliaApi.knowledgeBox.id, 'labels');
};
export const getLabelFacets = (labelSet: string): Observable<Search.FacetsResult> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return withCache<Search.FacetsResult>(
    () => nucliaApi!.knowledgeBox.getFacets([getFilterFromLabelSet(labelSet)]),
    nucliaApi.knowledgeBox.id,
    `label_facets_${labelSet}`,
  );
};
export const getMimeFacets = (): Observable<Search.FacetsResult> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return nucliaApi.knowledgeBox.getFacets(MIME_FACETS);
};
export const getFacets = (facets: string[]): Observable<Search.FacetsResult> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return nucliaApi.knowledgeBox.getFacets(facets);
};

export const getFile = (path: string): Observable<string> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return nucliaApi.rest.getObjectURL(path);
};

export const getRegionalBackend = () => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return nucliaApi.options.standalone || nucliaApi.options.proxy
    ? `${nucliaApi.options.backend}/v1`
    : nucliaApi.regionalBackend + '/v1';
};

export const getTempToken = (): Observable<string> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return nucliaApi.knowledgeBox.getTempToken();
};

export function getPdfSrc(path: string): string | { url: string; httpHeaders: any } {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return nucliaApi.options.standalone ? { url: path, httpHeaders: { 'X-NUCLIADB-ROLES': 'READER' } } : path;
}

export const isPrivateKnowledgeBox = (): boolean => {
  return STATE === 'PRIVATE' || !!nucliaApi?.options?.standalone;
};

export const hasAuthData = (): boolean => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return !!nucliaApi.options?.apiKey || !!nucliaApi.auth.getToken();
};

export const getFileUrls = (paths: string[], inline = false): Observable<string[]> => {
  const doesNotNeedToken = paths.length === 0 || !isPrivateKnowledgeBox();
  return (doesNotNeedToken ? of('') : getTempToken()).pipe(
    map((token) =>
      paths.map((path) => {
        if (path.startsWith('/')) {
          const params = [token ? `eph-token=${token}` : '', inline ? 'inline=true' : ''].filter(Boolean).join('&');
          const fullpath = `${getRegionalBackend()}${path}`;
          return params ? `${fullpath}?${params}` : fullpath;
        } else {
          return path;
        }
      }),
    ),
  );
};

export const getFileUrl = (path?: string): Observable<string> =>
  path ? getFileUrls([path]).pipe(map((urls) => urls[0])) : of('');

export function getTextFile(path: string): Observable<string> {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return nucliaApi.rest.get<Response>(path, {}, true).pipe(switchMap((res) => from(res.text())));
}

export function getEvents(): IEvents {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return nucliaApi.events;
}

export function downloadDump() {
  nucliaApi?.events
    ?.dump()
    .pipe(take(1))
    .subscribe((data) => downloadAsJSON(data));
}

export function getApiErrors() {
  return merge(searchError, suggestionError, chatError).pipe(
    filter((error) => !!error?.status),
    map((error) => ({
      status: error?.status,
      detail: error?.detail,
    })),
  );
}

export function getAttachedImageTemplate(placeholder: string): Observable<string> {
  const path = `${nucliaApi?.knowledgeBox.path}/resource/${placeholder}`;
  return getFileUrl(path);
}

export function getNotEngoughDataMessage() {
  return NOT_ENOUGH_DATA_MESSAGE || 'answer.error.llm_cannot_answer';
}

export function getRouting(question: string, routing: Routing): Observable<string> {
  const rules = routing.direct_answer
    ? [...routing.rules, { search_config: 'DIRECT_ANSWER', prompt: routing.direct_answer }]
    : routing.rules;

  const configs = rules.map((rule) => rule.search_config);
  const rulesPrompt = rules
    .map(
      (rule) => `- Category name: ${rule.search_config}
  Description: ${rule.prompt}
  If that's the case, return "${rule.search_config}".`,
    )
    .join(`\n\n`);
  const fullPrompt = `Identify which of the following categories is the most appropriate for the question, and return the corresponding category name.

**CATEGORIES**:

${rulesPrompt}

- Category name: FALLBACK
  Description: If none of the previous descriptions correspond to the question, return "FALLBACK".

**ANSWER**:
Only return the category name. The value must be ${configs.map((c) => `"${c}"`).join(' or ')} or "FALLBACK".
`;
  const answer_json_schema: object = {
    name: 'routing',
    description:
      'User intent analysis. The objective is to return the id of the most appropriate category for the given question',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: fullPrompt,
        },
      },
      required: ['category'],
    },
  };

  return getAnswerWithoutRAG(question, undefined, {
    answer_json_schema,
    generative_model: routing.generative_model,
    synchronous: true,
  }).pipe(
    map((res) => {
      if (res.type === 'error') {
        return 'FALLBACK';
      } else {
        return res.jsonAnswer?.category && configs.includes(res.jsonAnswer?.category)
          ? res.jsonAnswer.category
          : 'FALLBACK';
      }
    }),
    tap((config) => routedConfig.set(config)),
  );
}
