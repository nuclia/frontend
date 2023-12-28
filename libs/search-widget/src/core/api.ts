import type {
  ChatOptions,
  Classification,
  FieldFullId,
  FieldMetadata,
  IErrorResponse,
  IEvents,
  IResource,
  KBStates,
  LabelSets,
  NucliaOptions,
  Resource,
  ResourceField,
  SearchOptions,
} from '@nuclia/core';
import { Chat, ExtractedDataTypes, Nuclia, ResourceFieldProperties, ResourceProperties, Search } from '@nuclia/core';
import { filter, forkJoin, from, map, merge, Observable, of, switchMap, take, tap } from 'rxjs';
import type { EntityGroup, WidgetOptions } from './models';
import { entitiesDefaultColor, generatedEntitiesColor, getCDN } from './utils';
import { _, translateInstant } from './i18n';
import { suggestionError } from './stores/suggestions.store';
import { NucliaPrediction } from '@nuclia/prediction';
import { searchError, searchOptions } from './stores/search.store';
import { initTracking, logEvent } from './tracking';
import { hasViewerSearchError } from './stores/viewer.store';

const DEFAULT_SEARCH_MODE = [Search.Features.PARAGRAPH, Search.Features.VECTOR];
const DEFAULT_CHAT_MODE = [Chat.Features.VECTORS, Chat.Features.PARAGRAPHS];
const DEFAULT_SEARCH_OPTIONS: Partial<SearchOptions> = {};
// IMPORTANT! do not initialise those options outside initNuclia,
// otherwise options might be kept in memory when using the widget generator
let nucliaApi: Nuclia | null;
let nucliaPrediction: NucliaPrediction | null;
let STATE: KBStates;
let SEARCH_MODE: Search.Features[];
let CHAT_MODE: Chat.Features[];
let SEARCH_OPTIONS: Partial<SearchOptions>;
let SUGGEST_MODE: Search.SuggestionFeatures[];
let prompt: string | undefined = undefined;
let CITATIONS = false;

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

  if (nucliaApi) {
    throw new Error('Cannot exist more than one Nuclia widget at the same time');
  }
  if (widgetOptions.features?.useSynonyms && widgetOptions.features?.relations) {
    throw new Error('Cannot use synonyms and relations at the same time');
  }
  if (widgetOptions.fuzzyOnly || widgetOptions.features?.useSynonyms) {
    SEARCH_MODE = [Search.Features.PARAGRAPH];
  }
  if (widgetOptions.features?.useSynonyms) {
    SEARCH_OPTIONS.with_synonyms = true;
  }
  CITATIONS = !!widgetOptions.features?.citations;

  nucliaApi = new Nuclia(options);
  if (!noTracking) {
    initTracking(nucliaApi.options.knowledgeBox || 'kb not defined');
    logEvent('init', {
      widget_features: Object.entries(widgetOptions?.features || {})
        .filter(([, value]) => !!value)
        .map(([key]) => key)
        .join(','),
    });
  }

  searchOptions.set({
    inTitleOnly: false,
    highlight: widgetOptions.highlight,
    autofilter: !!widgetOptions.features?.autofilter,
  });
  prompt = widgetOptions.prompt;

  if (widgetOptions.features?.suggestLabels) {
    const kbPath = nucliaApi?.knowledgeBox.fullpath;
    if (kbPath) {
      nucliaPrediction = new NucliaPrediction(getCDN());
      const authHeaders = state === 'PRIVATE' ? nucliaApi.auth.getAuthHeaders() : {};
      nucliaPrediction.loadModels(kbPath, authHeaders);
    }
  }
  if (widgetOptions.features?.relations && !SEARCH_MODE.includes(Search.Features.RELATIONS)) {
    SEARCH_MODE.push(Search.Features.RELATIONS);
    CHAT_MODE.push(Chat.Features.RELATIONS);
  }
  if (widgetOptions.features?.suggestions) {
    SUGGEST_MODE.push(Search.SuggestionFeatures.PARAGRAPH);
  }
  if (widgetOptions.features?.autocompleteFromNERs) {
    SUGGEST_MODE.push(Search.SuggestionFeatures.ENTITIES);
  }
  if (widgetOptions.features?.noBM25forChat) {
    CHAT_MODE = CHAT_MODE.filter((feature) => feature !== Chat.Features.PARAGRAPHS);
  }
  STATE = state;

  return nucliaApi;
};

export const resetNuclia = () => {
  nucliaApi = null;
  SEARCH_MODE = [...DEFAULT_SEARCH_MODE];
  CHAT_MODE = [...DEFAULT_CHAT_MODE];
  SUGGEST_MODE = [];
};

export const search = (query: string, options: SearchOptions): Observable<Search.FindResults> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }

  return nucliaApi.knowledgeBox.find(query, SEARCH_MODE, { ...SEARCH_OPTIONS, ...options }).pipe(
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
  chat?: Chat.Entry[],
  options?: ChatOptions,
): Observable<Chat.Answer | IErrorResponse> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  const context = chat?.reduce((acc, curr) => {
    acc.push({ author: Chat.Author.USER, text: curr.question });
    acc.push({ author: Chat.Author.NUCLIA, text: curr.answer.text });
    return acc;
  }, [] as Chat.ContextEntry[]);
  const defaultOptions: ChatOptions = {
    highlight: true,
    prompt,
    citations: CITATIONS,
  };
  return nucliaApi.knowledgeBox.chat(
    query,
    context,
    CHAT_MODE,
    options ? { ...options, ...defaultOptions } : defaultOptions,
  );
};

export const sendFeedback = (answer: Chat.Answer, approved: boolean) => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return nucliaApi.knowledgeBox.feedback(answer.id, approved);
};

export const searchInResource = (
  query: string,
  resource: IResource,
  options: SearchOptions,
  features: Search.ResourceFeatures[] = [Search.ResourceFeatures.PARAGRAPH],
): Observable<Search.FindResults> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  options.inTitleOnly = !query && (!options.filters || options.filters.length === 0);

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

  return nucliaApi.knowledgeBox.suggest(query, true, SUGGEST_MODE).pipe(
    filter((res) => {
      if (res.type === 'error') {
        suggestionError.set(res);
      }
      return res.type === 'suggestions';
    }),
  );
};

export const predict = (query: string): Observable<Classification[]> => {
  if (!nucliaPrediction) {
    throw new Error('Nuclia prediction not initialized');
  }

  return nucliaPrediction.predict(query);
};

export const getResource = (uid: string): Observable<Resource> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return merge(getResourceById(uid, [ResourceProperties.BASIC, ResourceProperties.ORIGIN]), getResourceById(uid));
};

export const getResourceById = (uid: string, show?: ResourceProperties[]): Observable<Resource> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return nucliaApi.knowledgeBox.getResource(uid, show);
};

export function getResourceField(fullFieldId: FieldFullId, valueOnly = false): Observable<ResourceField> {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return nucliaApi.knowledgeBox
    .getResourceFromData({ id: fullFieldId.resourceId })
    .getField(
      fullFieldId.field_type,
      fullFieldId.field_id,
      valueOnly ? [ResourceFieldProperties.VALUE] : [ResourceFieldProperties.VALUE, ResourceFieldProperties.EXTRACTED],
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
  if (!_entities) {
    return forkJoin([nucliaApi.knowledgeBox.getEntities(true), _.pipe(take(1))]).pipe(
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
            entities: Object.entries(group.entities)
              .map(([, entity]) => entity.value)
              .sort((a, b) => a.localeCompare(b)),
            custom: group.custom,
          }))
          .sort((a, b) => translate(a.title).localeCompare(translate(b.title))),
      ),
      tap((entities) => (_entities = entities || [])),
    );
  } else {
    return of(_entities as EntityGroup[]);
  }
};

export const getLabelSets = (): Observable<LabelSets> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return nucliaApi.knowledgeBox.getLabels();
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
          const params = (token ? `eph-token=${token}` : '') + (inline ? `inline=true` : '');
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
