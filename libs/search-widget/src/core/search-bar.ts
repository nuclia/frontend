import { distinctUntilChanged, forkJoin, merge } from 'rxjs';
import { debounceTime, filter, map, switchMap, take, tap } from 'rxjs/operators';
import { nucliaState, nucliaStore } from './old-stores/main.store';
import { NO_RESULTS, PENDING_RESULTS } from './models';
import { search, suggest } from './api';
import { predict } from './tensor';

export const setupSuggestionsAndPredictions = (): void => {
  merge(
    // Trigger suggestion when hitting space between words
    nucliaStore().query.pipe(filter((query) => query.slice(-1) === ' ' && query.slice(-2, -1) !== ' ')),
    // Trigger suggestion after 500ms of inactivity
    nucliaStore().query.pipe(debounceTime(500)),
  )
    .pipe(
      // Don't trigger suggestion after inactivity if only spaces were added at the end of the query
      distinctUntilChanged((previous, current) => previous.trim() === current.trim()),
      tap(() => {
        nucliaStore().suggestions.next(NO_RESULTS);
        nucliaStore().intents.next({});
      }),
      filter((query) => !!query && query.length > 2),
      tap(() => nucliaStore().suggestions.next(PENDING_RESULTS)),
      switchMap((query) =>
        forkJoin([
          suggest(query).pipe(tap((results) => nucliaStore().suggestions.next(results))),
          predict(query).pipe(
            tap((predictions) =>
              nucliaStore().intents.next({
                labels: predictions,
              }),
            ),
          ),
        ]),
      ),
    )
    .subscribe();
};

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
