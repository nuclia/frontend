import { Nuclia, ResourceProperties, Search, Resource } from '../../../sdk-core/src';
import type { NucliaOptions, KBStates } from '@nuclia/core';
import { Observable, map, merge, of, filter } from 'rxjs';
import { nucliaStore } from './store';

let nucliaApi: Nuclia | null;
let STATE: KBStates;

export const initNuclia = (widgetId: string, options: NucliaOptions, state: KBStates) => {
  if (nucliaApi) {
    throw new Error('Cannot exist more than one Nuclia widget at the same time');
  }
  nucliaApi = new Nuclia(options);
  nucliaApi.knowledgeBox.getWidget(widgetId).subscribe(nucliaStore().widget);
  STATE = state;
};

export const resetNuclia = () => {
  nucliaApi = null;
};

export const search = (query: string) => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return nucliaApi.knowledgeBox
    .search(query, [Search.Features.PARAGRAPH, Search.Features.VECTOR, Search.Features.DOCUMENT])
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
}

export const isPrivateKnowledgeBox = (): boolean => {
  return STATE === 'PRIVATE';
}

export const getFileUrls = (paths: string[]): Observable<string[]> => {
  if (paths.length === 0 || !isPrivateKnowledgeBox()) {
    return of(paths.map((path) => `${getRegionalBackend()}${path}`));
  } else {
    return getTempToken()
      .pipe(map((token) => paths.map((path) => `${getRegionalBackend()}${path}?eph-token=${token}`)));
  }
};
