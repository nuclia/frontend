import {
  Chat,
  Classification,
  Entity,
  FieldFullId,
  IResource,
  KBStates,
  LabelSets,
  Nuclia,
  NucliaOptions,
  Resource,
  ResourceField,
  ResourceFieldProperties,
  ResourceProperties,
  Search,
  SearchOptions,
  TokenAnnotation,
  WritableKnowledgeBox,
} from '@nuclia/core';
import type { Observable } from 'rxjs';
import { filter, forkJoin, map, merge, of, take, tap } from 'rxjs';
import type { EntityGroup, WidgetOptions } from './models';
import { generatedEntitiesColor, getCDN } from './utils';
import { _ } from './i18n';
import type { Annotation } from './stores/annotation.store';
import { suggestionError } from './stores/suggestions.store';
import { NucliaPrediction } from '@nuclia/prediction';
import { searchError, searchOptions } from './stores/search.store';
import { hasViewerSearchError } from './stores/viewer-search.store';

let nucliaApi: Nuclia | null;
let nucliaPrediction: NucliaPrediction | null;
let STATE: KBStates;
let SEARCH_MODE = [Search.Features.PARAGRAPH, Search.Features.VECTOR];

export const initNuclia = (options: NucliaOptions, state: KBStates, widgetOptions: WidgetOptions) => {
  if (nucliaApi) {
    throw new Error('Cannot exist more than one Nuclia widget at the same time');
  }
  if (widgetOptions.fuzzyOnly) {
    SEARCH_MODE = [Search.Features.PARAGRAPH];
  }
  nucliaApi = new Nuclia(options);
  searchOptions.set({ inTitleOnly: false, highlight: widgetOptions.highlight });
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
  }
  STATE = state;
};

export const resetNuclia = () => {
  nucliaApi = null;
};

export const search = (query: string, options: SearchOptions): Observable<Search.FindResults> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }

  return nucliaApi.knowledgeBox.find(query, SEARCH_MODE, options).pipe(
    filter((res) => {
      if (res.type === 'error') {
        searchError.set(res);
      }
      return res.type === 'findResults';
    }),
    map((res) => res as Search.FindResults),
  );
};

export const getAnswer = (query: string, chat?: Chat.Entry[]) => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  const context = chat?.reduce((acc, curr) => {
    acc.push({ author: Chat.Author.USER, text: curr.question });
    acc.push({ author: Chat.Author.NUCLIA, text: curr.answer.text });
    return acc;
  }, [] as Chat.ContextEntry[]);

  return nucliaApi.knowledgeBox.chat(query, context);
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
): Observable<Search.Results> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  if (!query) {
    options.inTitleOnly = true;
  }
  return nucliaApi.knowledgeBox
    .getResourceFromData(resource)
    .search(query, features, options)
    .pipe(
      filter((res) => {
        if (res.type === 'error') {
          hasViewerSearchError.set(true);
        }
        return res.type === 'searchResults';
      }),
      map((res) => res as Search.Results),
    );
};

export const suggest = (query: string) => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }

  return nucliaApi.knowledgeBox.suggest(query, true).pipe(
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
  return merge(nucliaApi.knowledgeBox.getResource(uid, show));
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

let _entities: EntityGroup[] | undefined = undefined;
export const loadEntities = (): Observable<EntityGroup[]> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  if (!_entities) {
    return forkJoin([nucliaApi.knowledgeBox.getEntities(), _.pipe(take(1))]).pipe(
      map(([entityMap, translate]) =>
        Object.entries(entityMap)
          .map(([groupId, group]) => ({
            id: groupId,
            title: group.title || `entities.${groupId.toLowerCase()}`,
            color: group.color || generatedEntitiesColor[groupId],
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

export const setLabels = (
  resource: Resource,
  fieldId: string,
  fieldType: string,
  paragraphId: string,
  labels: Classification[],
): Observable<void> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return resource.setLabels(fieldId, fieldType, paragraphId, labels);
};

export const saveEntitiesAnnotations = (
  resource: Resource,
  field: { field_id: string; field_type: string },
  annotations: Annotation[],
) => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  const tokens: TokenAnnotation[] = annotations.map((annotation) => ({
    klass: annotation.entityFamilyId,
    token: annotation.entity,
    start: annotation.start + annotation.paragraphStart,
    end: annotation.end + annotation.paragraphStart,
  }));
  return resource.setEntities(field.field_id, field.field_type, tokens);
};

function entityListToMap(entityList: string[]): { [key: string]: Entity } {
  return entityList.reduce((map, currentValue) => {
    map[currentValue] = { value: currentValue };
    return map;
  }, {} as { [key: string]: Entity });
}

export const saveEntities = (backup: EntityGroup[], newGroups: EntityGroup[]) => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  const requestList: Observable<void>[] = [];
  const nucliaAPI = nucliaApi;
  newGroups.forEach((group) => {
    const writableKb = new WritableKnowledgeBox(nucliaAPI, '', {
      id: nucliaAPI.options.knowledgeBox || '',
      zone: nucliaAPI.options.zone || '',
    });
    const backupGroup = backup.find((g) => g.id === group.id);
    if (!!backupGroup && JSON.stringify(group.entities) !== JSON.stringify(backupGroup.entities)) {
      requestList.push(
        writableKb.setEntitiesGroup(group.id, {
          title: group.title,
          color: group.color,
          entities: entityListToMap(group.entities),
        }),
      );
    }
  });
  return forkJoin(requestList);
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
  return nucliaApi.options.standalone ? `${nucliaApi.options.backend}/v1` : nucliaApi.regionalBackend + '/v1';
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
  return STATE === 'PRIVATE';
};

export const hasAuthData = (): boolean => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return !!nucliaApi.options?.apiKey || !!nucliaApi.auth.getToken();
};

export const getFileUrls = (paths: string[]): Observable<string[]> => {
  const doesNotNeedToken = paths.length === 0 || !isPrivateKnowledgeBox();
  return (doesNotNeedToken ? of('') : getTempToken()).pipe(
    map((token) =>
      paths.map((path) => {
        if (path.startsWith('/')) {
          const fullpath = `${getRegionalBackend()}${path}`;
          return token ? `${fullpath}?eph-token=${token}` : fullpath;
        } else {
          return path;
        }
      }),
    ),
  );
};

export const getFileUrl = (path?: string): Observable<string> =>
  path ? getFileUrls([path]).pipe(map((urls) => urls[0])) : of('');
