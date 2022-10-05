import type {
  Classification,
  Entities,
  Entity,
  KBStates,
  Labels,
  NucliaOptions,
  SearchOptions,
  TokenAnnotation,
} from '@nuclia/core';
import { Nuclia, Resource, ResourceProperties, Search, WritableKnowledgeBox } from '@nuclia/core';
import { filter, forkJoin, map, merge, Observable, of, take, tap } from 'rxjs';
import { nucliaStore } from './stores/main.store';
import { loadModel } from './tensor';
import type { EntityGroup, WidgetOptions } from './models';
import { generatedEntitiesColor } from './utils';
import { _ } from './i18n';
import type { Annotation } from './stores/annotation.store';
import { refreshAnnotatedEntities } from './stores/resource.store';

let nucliaApi: Nuclia | null;
let STATE: KBStates;
let SEARCH_MODE = [Search.Features.PARAGRAPH, Search.Features.VECTOR, Search.Features.DOCUMENT];

export const initNuclia = (widgetId: string, options: NucliaOptions, state: KBStates, widgetOptions: WidgetOptions) => {
  if (nucliaApi) {
    throw new Error('Cannot exist more than one Nuclia widget at the same time');
  }
  if (widgetOptions.fuzzyOnly) {
    SEARCH_MODE = [Search.Features.PARAGRAPH];
  }
  nucliaApi = new Nuclia(options);
  nucliaApi.knowledgeBox.getWidget(widgetId).subscribe((widget) => {
    nucliaStore().searchOptions.next({ inTitleOnly: false, highlight: widgetOptions.highlight });
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
  return forkJoin([nucliaApi.knowledgeBox.getEntities(), _.pipe(take(1))]).pipe(
    map(([entityMap, translate]) =>
      Object.entries(entityMap)
        .map(([groupId, group]) => ({
          id: groupId,
          title: group.title || `entities.${groupId.toLowerCase()}`,
          color: group.color || generatedEntitiesColor[groupId],
          entities: Object.entries(group.entities)
            .map(([entityId, entity]) => entity.value)
            .sort((a, b) => a.localeCompare(b)),
          custom: group.custom,
        }))
        .sort((a, b) => translate(a.title).localeCompare(translate(b.title))),
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
  return resource
    .setEntities(field.field_id, field.field_type, tokens)
    .pipe(tap(() => refreshAnnotatedEntities(resource)));
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
  newGroups.forEach((group) => {
    const writableKb = new WritableKnowledgeBox(nucliaApi!, '', {
      id: nucliaApi!.options.knowledgeBox!,
      zone: nucliaApi!.options.zone!,
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
