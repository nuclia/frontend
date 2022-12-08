import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { nucliaState, nucliaStore } from './old-stores/main.store';
import { PENDING_RESULTS } from './models';
import { search } from './api';
import { navigateToLink } from '../core/stores/widget.store';
import { ResourceProperties } from '@nuclia/core';
import { forkJoin } from 'rxjs';

export const setupTriggerSearch = (dispatch: (event: string, details: any) => void | undefined): void => {
  nucliaStore()
    .triggerSearch.pipe(
      tap(() => nucliaStore().searchResults.next(PENDING_RESULTS)),
      switchMap(() => nucliaState().isEmptySearchQuery.pipe(take(1))),
      filter((isEmptySearchQuery) => !isEmptySearchQuery),
      switchMap(() => nucliaState().query.pipe(take(1))),
      map((query) => query.trim()),
      tap((query) => (dispatch ? dispatch('search', query) : undefined)),
      switchMap((query) =>
        forkJoin([
          nucliaStore().searchOptions.pipe(take(1)),
          nucliaStore().filters.pipe(take(1)),
          navigateToLink.pipe(take(1)),
        ]).pipe(
          map(([options, filters, navigateToLink]) => {
            const show = navigateToLink
              ? [ResourceProperties.BASIC, ResourceProperties.VALUES]
              : [ResourceProperties.BASIC];
            const currentOptions = { ...options, show, filters };
            return { query, options: currentOptions };
          }),
        ),
      ),
      switchMap(({ query, options }) => search(query, options)),
      tap((results) => {
        if (typeof dispatch === 'function') {
          dispatch('results', results);
        }
      }),
    )
    .subscribe((results) => nucliaStore().searchResults.next(results));
};
