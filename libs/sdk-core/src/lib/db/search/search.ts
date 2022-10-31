import { catchError, map, of, tap } from 'rxjs';
import type { INuclia } from '../../models';
import type { Search, SearchOptions } from './search.models';

export const search = (
  nuclia: INuclia,
  path: string,
  query: string,
  features: Search.Features[] | Search.ResourceFeatures[] = [],
  options?: SearchOptions,
) => {
  if (!query && !hasFiltersOrFacets(options)) {
    throw new Error('Search requires a query or some filters or some facets.');
  }
  const params: { [key: string]: string | string[] } = {};
  if (query) {
    params.query = query;
  }
  params.features = features;
  const { inTitleOnly, ...others } = options || {};
  if (inTitleOnly) {
    params.fields = 'a/title';
  }
  Object.entries(others || {}).forEach(([k, v]) => (params[k] = Array.isArray(v) ? v.map((el) => `${el}`) : `${v}`));
  const shards = nuclia.currentShards || [];
  params.shards = shards;
  return nuclia.rest.post<Search.Results | { detail: string }>(`${path}/search`, params).pipe(
    catchError(() => of({ error: true } as Search.Results)),
    map((res) => (Object.keys(res).includes('detail') ? ({ error: true } as Search.Results) : (res as Search.Results))),
    tap((res) => {
      if (res.shards) {
        nuclia.currentShards = res.shards;
      }
    }),
  );
};

const hasFiltersOrFacets = (options?: SearchOptions): boolean => {
  return (options?.filters || []).length > 0 || (options?.faceted || []).length > 0;
};
