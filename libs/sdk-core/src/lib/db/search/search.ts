import { catchError, from, map, Observable, of, switchMap, tap } from 'rxjs';
import type { IErrorResponse, INuclia } from '../../models';
import type { CatalogOptions, SearchOptions } from './search.models';
import { Search } from './search.models';

export const find = (
  nuclia: INuclia,
  kbid: string,
  path: string,
  query: string,
  features: (Search.Features | Search.ResourceFeatures)[] = [],
  options?: SearchOptions,
  useGet?: boolean,
): Observable<Search.FindResults | IErrorResponse> => {
  options = options || {};
  if (
    options?.with_synonyms &&
    (features.includes(Search.Features.VECTOR) ||
      features.includes(Search.Features.SEMANTIC) ||
      features.includes(Search.Features.RELATIONS))
  ) {
    console.warn(`with_synonyms option cannot work with SEMANTIC and RELATIONS features`);
    features = features.filter(
      (feature) =>
        feature !== Search.Features.VECTOR &&
        feature !== Search.Features.SEMANTIC &&
        feature !== Search.Features.RELATIONS,
    );
  }
  const params: { [key: string]: string | string[] } = {
    query: query || '',
    features,
  };

  params['shards'] = nuclia.currentShards?.[kbid] || [];
  const endpoint = `${path}/find`;
  nuclia.events?.log('lastQuery', {
    endpoint,
    params: { ...params, ...options },
    headers: nuclia.rest.getHeaders(useGet ? 'GET' : 'POST', endpoint),
    nucliaOptions: nuclia.options,
  });
  const searchMethod = useGet
    ? nuclia.rest.get<Response>(`${endpoint}?${serialize(params, options)}`, undefined, true)
    : nuclia.rest.post<Response>(endpoint, { ...params, ...options }, undefined, true);
  return searchMethod.pipe(
    switchMap((res) => {
      const searchId = res.headers.get('X-Nuclia-Trace-Id') || '';
      // status 206 means we got partial results
      if (!res.ok || res.status === 206) {
        if (res.status === 206) {
          nuclia.events?.emit<{ [key: string]: any }>('partial', { ...params, ...options });
        }
        return from(
          res.json().then(
            (body) => {
              throw { status: res.status, body };
            },
            () => {
              throw { status: res.status };
            },
          ),
        );
      } else {
        return from(
          res.json().then(
            (json) => ({ ...json, searchId }),
            () => {
              console.warn(`${endpoint} did not return a valid JSON`);
              return undefined;
            },
          ),
        );
      }
    }),
    catchError((error) =>
      of({ type: 'error', status: error.status, detail: error.detail, body: error.body } as IErrorResponse),
    ),
    map((res) => (res.type === 'error' ? res : ({ ...res, type: 'findResults' } as Search.FindResults))),
    tap((res) => {
      nuclia.events?.log('lastResults', res);
      if (res.type === 'findResults' && res.shards) {
        nuclia.currentShards = { ...nuclia.currentShards, [kbid]: res.shards };
      }
    }),
  );
};

export const search = (
  nuclia: INuclia,
  kbid: string,
  path: string,
  query: string,
  features: Search.Features[] | Search.ResourceFeatures[] = [],
  options?: SearchOptions,
  useGet?: boolean,
): Observable<Search.Results | IErrorResponse> => {
  options = options || {};
  const params: { [key: string]: string | string[] } = {
    query: query || '',
    features,
  };
  params['shards'] = nuclia.currentShards?.[kbid] || [];
  const endpoint = `${path}/search`;
  nuclia.events?.log('lastQuery', {
    endpoint,
    headers: nuclia.rest.getHeaders(useGet ? 'GET' : 'POST', endpoint),
    params: { ...params, ...options },
    nucliaOptions: nuclia.options,
  });
  const searchMethod = useGet
    ? nuclia.rest.get<Search.Results | IErrorResponse>(`${endpoint}?${serialize(params, options)}`)
    : nuclia.rest.post<Search.Results | IErrorResponse>(endpoint, { ...params, ...options });
  return manageSearchRequest(nuclia, kbid, searchMethod).pipe(tap((res) => nuclia.events?.log('lastResults', res)));
};

export const catalog = (nuclia: INuclia, kbid: string, query: string, options?: CatalogOptions, useGet?: boolean) => {
  const params: { [key: string]: string | string[] } = {};
  params['query'] = query || '';
  params['shards'] = nuclia.currentShards?.[kbid] || [];
  const path = `/kb/${kbid}`;
  const searchMethod = useGet
    ? nuclia.rest.get<Search.Results | IErrorResponse>(`${path}/catalog?${options ? serialize(params, options) : ''}`)
    : nuclia.rest.post<Search.Results | IErrorResponse>(`${path}/catalog`, { ...params, ...options });
  return manageSearchRequest(nuclia, kbid, searchMethod);
};

export const suggest = (
  nuclia: INuclia,
  kbid: string,
  path: string,
  query: string,
  inTitleOnly: boolean,
  features: Search.SuggestionFeatures[],
) => {
  const params: { [key: string]: string | string[] } = {
    query: query || '',
    features,
  };
  if (inTitleOnly) {
    params['fields'] = ['a/title'];
  }
  return nuclia.rest.get<Search.Suggestions | IErrorResponse>(`${path}/suggest?${serialize(params, {})}`).pipe(
    catchError((error) => of({ type: 'error', status: error.status, detail: error.detail } as IErrorResponse)),
    map((res) => (res.type === 'error' ? res : ({ ...res, type: 'suggestions' } as Search.Suggestions))),
  );
};

function manageSearchRequest(
  nuclia: INuclia,
  kbid: string,
  searchMethod: Observable<Search.Results | IErrorResponse>,
): Observable<Search.Results | IErrorResponse> {
  return searchMethod.pipe(
    catchError((error) => of({ type: 'error', status: error.status, detail: error.detail } as IErrorResponse)),
    map((res) => (res.type === 'error' ? res : ({ ...res, type: 'searchResults' } as Search.Results))),
    tap((res) => {
      if (res.type === 'searchResults' && res.shards) {
        nuclia.currentShards = { ...nuclia.currentShards, [kbid]: res.shards };
      }
    }),
  );
}

const serialize = (params: { [key: string]: string | string[] }, others: SearchOptions): string => {
  Object.entries(others || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        params[key] = value.map((el) => `${el}`);
      } else if (typeof value === 'object') {
        Object.entries(value).forEach(([k, v]) => (params[`${key}_${k}`] = `${v}`));
      } else {
        params[key] = `${value}`;
      }
    }
  });
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) =>
    Array.isArray(value) ? value.forEach((item) => queryParams.append(key, item)) : queryParams.append(key, value),
  );
  return queryParams.toString();
};
