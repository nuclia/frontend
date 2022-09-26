import type {
  Classification,
  Entities,
  KBStates,
  Labels,
  NucliaOptions,
  SearchOptions,
  TokenAnnotation,
} from '@nuclia/core';
import { Nuclia, Resource, ResourceProperties, Search } from '@nuclia/core';
import { filter, map, merge, Observable, of } from 'rxjs';
import { nucliaStore } from './store';
import { loadModel } from './tensor';
import type { EntityGroup } from './models';
import { generatedEntitiesColor } from './utils';
import type { Annotation } from '../viewer/stores/annotation.store';

let nucliaApi: Nuclia | null;
let STATE: KBStates;
let SEARCH_MODE = [Search.Features.PARAGRAPH, Search.Features.VECTOR, Search.Features.DOCUMENT];

export const initNuclia = (widgetId: string, options: NucliaOptions, state: KBStates, fuzzyOnly = false) => {
  if (nucliaApi) {
    throw new Error('Cannot exist more than one Nuclia widget at the same time');
  }
  if (fuzzyOnly) {
    SEARCH_MODE = [Search.Features.PARAGRAPH];
  }
  nucliaApi = new Nuclia(options);
  nucliaApi.knowledgeBox.getWidget(widgetId).subscribe((widget) => {
    nucliaStore().searchOptions.next({ inTitleOnly: false, highlight: options.highlight });
    nucliaStore().widget.next(widget);
    if (widget.features.suggestLabels) {
      const kbPath = nucliaApi?.knowledgeBox.fullpath;
      if (kbPath) {
        loadModel(
          `${kbPath}/train/classifier/model/json_models/model.json`,
          `${kbPath}/train/classifier/model/model_files/pos_to_lab.json`,
          state === 'PRIVATE' ? nucliaApi!.auth.getAuthHeaders() : {},
        );
      }
    }
  });
  STATE = state;
};

export const resetNuclia = () => {
  nucliaApi = null;
};

export const search = (query: string, options: SearchOptions) => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return nucliaApi.knowledgeBox.search(query, SEARCH_MODE, options).pipe(
    filter((res) => {
      if (res.error) {
        nucliaStore().hasSearchError.next(true);
      }
      return !res.error;
    }),
  );
};

export const suggest = (query: string) => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }

  return nucliaApi.knowledgeBox.suggest(query).pipe(
    filter((res) => {
      if (res.error) {
        nucliaStore().hasSearchError.next(true);
      }
      return !res.error;
    }),
  );
};

export const getResource = (uid: string): Observable<Resource> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return merge(
    nucliaApi.knowledgeBox.getResource(uid, [ResourceProperties.BASIC, ResourceProperties.ORIGIN]),
    nucliaApi.knowledgeBox.getResource(uid),
  );
};

export const loadEntities = (): Observable<EntityGroup[]> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return nucliaApi.knowledgeBox.getEntities().pipe(
    map((entityMap: Entities) =>
      Object.entries(entityMap)
        .map(([groupId, group]) => ({
          id: groupId,
          title: group.title || `entities.${groupId.toLowerCase()}`,
          color: group.color || generatedEntitiesColor[groupId],
          entities: Object.entries(group.entities).map(([entityId, entity]) => entity.value),
          custom: group.custom,
        }))
        .sort((a, b) => a.id.localeCompare(b.id)),
    ),
  );
};

export const getLabels = (): Observable<Labels> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return nucliaApi.knowledgeBox.getLabels();
};

export const setLabels = (
  resource: Resource,
  fieldType: string,
  fieldId: string,
  paragraphId: string,
  labels: Classification[],
): Observable<void> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return resource.setLabels(fieldType, fieldId, paragraphId, labels);
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
  return nucliaApi.regionalBackend + '/v1';
};

export const getTempToken = (): Observable<string> => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return nucliaApi.knowledgeBox.getTempToken();
};

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
  if (paths.length === 0 || !isPrivateKnowledgeBox()) {
    return of(paths.map((path) => `${getRegionalBackend()}${path}`));
  } else {
    return getTempToken().pipe(
      map((token) => paths.map((path) => `${getRegionalBackend()}${path}?eph-token=${token}`)),
    );
  }
};
