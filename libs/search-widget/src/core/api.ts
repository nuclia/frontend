import { Nuclia, ResourceProperties, Search } from '../../../sdk-core/src';
import type { NucliaOptions, KBStates } from '@nuclia/core';
import { Observable, map, merge, of, filter } from 'rxjs';
import { nucliaStore } from './store';

let nucliaApi: Nuclia;
let STATE: KBStates;

export const initNuclia = (widgetId: string, options: NucliaOptions, state: KBStates) => {
  nucliaApi = new Nuclia(options);
  nucliaApi.knowledgeBox.getWidget(widgetId).subscribe(nucliaStore().widget);
  STATE = state;
};

export const search = (query: string, suggestions = false) => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return nucliaApi.knowledgeBox
    .search(
      query,
      suggestions
        ? [Search.Features.PARAGRAPH, Search.Features.RELATIONS]
        : [Search.Features.PARAGRAPH, Search.Features.VECTOR, Search.Features.DOCUMENT],
    )
    .pipe(
      filter((res) => {
        if (res.error) {
          nucliaStore().hasSearchError.next(true);
        }
        return !res.error;
      }),
    );
};

export const getResource = (uid: string) => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return merge(
    nucliaApi.knowledgeBox.getResource(uid, [ResourceProperties.BASIC, ResourceProperties.ORIGIN]),
    nucliaApi.knowledgeBox.getResource(uid),
  );
};

export const getFile = (path: string): Observable<string> => {
  return nucliaApi.rest.getObjectURL(path);
};

export const getRegionalBackend = () => {
  if (!nucliaApi) {
    throw new Error('Nuclia API not initialized');
  }
  return nucliaApi.regionalBackend + '/v1';
};

export const getFileUrls = (paths: string[]): Observable<string[]> => {
  if (paths.length === 0 || STATE !== 'PRIVATE') {
    return of(paths.map((path) => `${getRegionalBackend()}${path}`));
  } else {
    return nucliaApi.knowledgeBox
      .getTempToken()
      .pipe(map((token) => paths.map((path) => `${getRegionalBackend()}${path}?eph-token=${token}`)));
  }
};
