import { catchError, map, of, tap } from 'rxjs';
import type { INuclia } from '../../models';
import type { Search, SearchOptions } from './search.models';

export const search = (
  nuclia: INuclia,
  kbid: string,
  path: string,
  query: string,
  features: Search.Features[] | Search.ResourceFeatures[] = [],
  options?: SearchOptions,
  useGet?: boolean,
) => {
  const params: { [key: string]: string | string[] } = {};
  params.query = query || '';
  params.features = features;
  const { inTitleOnly, ...others } = options || {};
  if (inTitleOnly) {
    params.fields = ['a/title'];
  }

  params.shards = nuclia.currentShards?.[kbid] || [];

  const searchMethod = useGet
    ? nuclia.rest.get<Search.Results | { detail: string }>(`${path}/search?${serialize(params, others)}`)
    : nuclia.rest.post<Search.Results | { detail: string }>(`${path}/search`, params);
  return searchMethod.pipe(
    catchError(() => of({ error: true } as Search.Results)),
    map((res) => (Object.keys(res).includes('detail') ? ({ error: true } as Search.Results) : (res as Search.Results))),
    tap((res) => {
      if (res.shards) {
        nuclia.currentShards = { ...nuclia.currentShards, [kbid]: res.shards };
      }
    }),
  );
};

const serialize = (params: { [key: string]: string | string[] }, others: SearchOptions): string => {
  Object.entries(others || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      params[key] = value.map((el) => `${el}`);
    } else if (typeof value === 'object') {
      Object.entries(value).forEach(([k, v]) => (params[`${key}_${k}`] = `${v}`));
    } else {
      params[key] = `${value}`;
    }
  });
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) =>
    Array.isArray(value) ? value.forEach((item) => queryParams.append(key, item)) : queryParams.append(key, value),
  );
  return queryParams.toString();
};

const hasFiltersOrFacets = (options?: SearchOptions): boolean => {
  return (options?.filters || []).length > 0 || (options?.faceted || []).length > 0;
};
