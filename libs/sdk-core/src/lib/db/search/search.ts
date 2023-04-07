import { catchError, map, Observable, of, tap } from 'rxjs';
import type { IErrorResponse, INuclia } from '../../models';
import type { Search, SearchOptions } from './search.models';

export const find = (
  nuclia: INuclia,
  kbid: string,
  path: string,
  query: string,
  features: Search.Features[] = [],
  options?: SearchOptions,
  useGet?: boolean,
): Observable<Search.FindResults | IErrorResponse> => {
  const params: { [key: string]: string | string[] } = {};
  if (options?.isAdvanced) {
    params['advanced_query'] = query || '';
  } else {
    params['query'] = query || '';
  }
  params['features'] = features;
  const { inTitleOnly, ...others } = options || {};
  if (inTitleOnly) {
    params['fields'] = ['a/title'];
  }

  params['shards'] = nuclia.currentShards?.[kbid] || [];
  const searchMethod = useGet
    ? nuclia.rest.get<Search.FindResults | IErrorResponse>(`${path}/find?${serialize(params, others)}`)
    : nuclia.rest.post<Search.FindResults | IErrorResponse>(`${path}/find`, { ...params, ...others });
  return searchMethod.pipe(
    catchError((error) => of({ type: 'error', status: error.status, detail: error.detail } as IErrorResponse)),
    map((res) => (res.type === 'error' ? res : ({ ...res, type: 'findResults' } as Search.FindResults))),
    tap((res) => {
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
  const params: { [key: string]: string | string[] } = {};
  params['query'] = query || '';
  params['features'] = features;
  const { inTitleOnly, ...others } = options || {};
  if (inTitleOnly) {
    params['fields'] = ['a/title'];
  }

  params['shards'] = nuclia.currentShards?.[kbid] || [];

  const searchMethod = useGet
    ? nuclia.rest.get<Search.Results | IErrorResponse>(`${path}/search?${serialize(params, others)}`)
    : nuclia.rest.post<Search.Results | IErrorResponse>(`${path}/search`, { ...params, ...others });
  return manageSearchRequest(nuclia, kbid, searchMethod);
};

export const catalog = (nuclia: INuclia, kbid: string, query: string, options?: SearchOptions) => {
  const params: { [key: string]: string | string[] } = {};
  params['query'] = query || '';
  params['shards'] = nuclia.currentShards?.[kbid] || [];
  const searchMethod = nuclia.rest.get<Search.Results | IErrorResponse>(
    `/kb/${kbid}/catalog?${options ? serialize(params, options) : ''}`,
  );
  return manageSearchRequest(nuclia, kbid, searchMethod);
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
