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
  if (!query && !hasFiltersOrFacets(options) && !options?.inTitleOnly) {
    throw new Error('Search requires a query or some filters or some facets.');
  }
  const params = new URLSearchParams();
  if (query) {
    params.append('query', query);
  }
  features.forEach((f) => params.append('features', f));
  const { inTitleOnly, ...others } = options || {};
  if (inTitleOnly) {
    params.append('fields', 'a/title');
  }
  Object.entries(others || {}).forEach(([k, v]) =>
    Array.isArray(v) ? v.forEach((v) => params.append(k, `${v}`)) : params.append(k, `${v}`),
  );
  const shards = nuclia.currentShards || [];
  shards.forEach((shard) => params.append('shards', shard));
  return nuclia.rest.get<Search.Results | { detail: string }>(`${path}/search?${params.toString()}`).pipe(
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
