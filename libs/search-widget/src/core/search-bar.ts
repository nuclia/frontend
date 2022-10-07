import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { nucliaState, nucliaStore } from './old-stores/main.store';
import { PENDING_RESULTS } from './models';
import { search } from './api';

export const setupTriggerSearch = (): void => {
  nucliaStore()
    .triggerSearch.pipe(
      tap(() => nucliaStore().searchResults.next(PENDING_RESULTS)),
      switchMap(() => nucliaState().query.pipe(take(1))),
      map((query) => query.trim()),
      filter((query) => !!query),
      switchMap((query) => nucliaStore().searchOptions.pipe(map((options) => ({ query, options })))),
      switchMap(({ query, options }) => search(query, options)),
    )
    .subscribe((results) => nucliaStore().searchResults.next(results));
};
