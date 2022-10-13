import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { nucliaState, nucliaStore } from './old-stores/main.store';
import { PENDING_RESULTS } from './models';
import { search } from './api';
import { labelRegexp } from '../common/label/label.utils';

export const setupTriggerSearch = (): void => {
  nucliaStore()
    .triggerSearch.pipe(
      tap(() => nucliaStore().searchResults.next(PENDING_RESULTS)),
      switchMap(() => nucliaState().query.pipe(take(1))),
      map((query) => query.trim()),
      filter((query) => !!query),
      switchMap((query) =>
        nucliaStore().searchOptions.pipe(
          map((options) => {
            let match;
            const currentOptions = { ...options };
            while ((match = labelRegexp.exec(query))) {
              if (!currentOptions.filters) {
                currentOptions.filters = [`/l/${match[1]}`];
              } else {
                currentOptions.filters.push(`/l/${match[1]}`);
              }
            }
            const cleanQuery = query.replace(labelRegexp, '').trim();
            return { query: cleanQuery, options: currentOptions };
          }),
        ),
      ),
      switchMap(({ query, options }) => search(query, options)),
    )
    .subscribe((results) => nucliaStore().searchResults.next(results));
};
