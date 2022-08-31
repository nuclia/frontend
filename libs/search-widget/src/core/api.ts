import { Nuclia, Resource, ResourceProperties, Search } from '../../../sdk-core/src';
import type { Classification, KBStates, Labels, NucliaOptions, SearchOptions } from '@nuclia/core';
import { filter, map, merge, Observable, of } from 'rxjs';
import { nucliaStore } from './store';
import { loadModel } from './tensor';

let nucliaApi: Nuclia | null;
let STATE: KBStates;

export const initNuclia = (widgetId: string, options: NucliaOptions, state: KBStates) => {
  if (nucliaApi) {
    throw new Error('Cannot exist more than one Nuclia widget at the same time');
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
  return nucliaApi.knowledgeBox
    .search(query, [Search.Features.PARAGRAPH, Search.Features.VECTOR, Search.Features.DOCUMENT], options)
    .pipe(
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
  return resource.modify({
    fieldmetadata: [
      {
        field: {
          field: fieldId,
          field_type: fieldType,
        },
        paragraphs: [
          {
            key: paragraphId,
            classifications: labels,
          },
        ],
      },
    ],
  });
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
