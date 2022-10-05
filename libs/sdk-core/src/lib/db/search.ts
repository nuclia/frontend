import { catchError, of, map, tap } from 'rxjs';
import type { INuclia } from '../models';
import type { Search, SearchOptions } from './search.models';

const SHARD_KEY = 'SHARD_KEY';

export const search = (
  nuclia: INuclia,
  kbId: string,
  path: string,
  query: string,
  features: Search.Features[] | Search.ResourceFeatures[] = [],
  options?: SearchOptions,
) => {
  const params = new URLSearchParams();
  params.append('query', query);
  features.forEach((f) => params.append('features', f));
  const { inTitleOnly, ...others } = options || {};
  if (inTitleOnly) {
    params.append('fields', 'a/title');
  }
  Object.entries(others || {}).forEach(([k, v]) =>
    Array.isArray(v) ? v.forEach((v) => params.append(k, `${v}`)) : params.append(k, `${v}`),
  );
  const allShards = JSON.parse(localStorage.getItem(SHARD_KEY) || '{}');
  const shards: string[] = allShards[kbId] || [];
  shards.forEach((shard) => params.append('shards', shard));
  return nuclia.rest.get<Search.Results | { detail: string }>(`${path}/search?${params.toString()}`).pipe(
    catchError(() => of({ error: true } as Search.Results)),
    map((res) => (Object.keys(res).includes('detail') ? ({ error: true } as Search.Results) : (res as Search.Results))),
    tap((res) => {
      if (res.shards) {
        allShards[kbId] = res.shards;
        localStorage.setItem(SHARD_KEY, JSON.stringify(allShards));
      }
    }),
  );
};
