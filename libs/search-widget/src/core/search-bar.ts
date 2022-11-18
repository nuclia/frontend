import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { nucliaState, nucliaStore } from './old-stores/main.store';
import { PENDING_RESULTS } from './models';
import { search } from './api';
import { navigateToLink } from '../core/stores/widget.store';
import { ResourceProperties } from '@nuclia/core';
import { forkJoin } from 'rxjs';

export const setupTriggerSearch = (dispatch: (event: string, search: string) => void | undefined): void => {
  nucliaStore()
    .triggerSearch.pipe(
      tap(() => nucliaStore().searchResults.next(PENDING_RESULTS)),
      switchMap(() => nucliaState().query.pipe(take(1))),
      map((query) => query.trim()),
      filter((query) => !!query),
      tap((query) => (dispatch ? dispatch('search', query) : undefined)),
      switchMap((query) =>
        forkJoin([nucliaStore().searchOptions.pipe(take(1)), nucliaStore().filters.pipe(take(1))]).pipe(
          map(([options, filters]) => {
            const show = navigateToLink.getValue() ? [ResourceProperties.BASIC, ResourceProperties.VALUES] : [];
            const currentOptions = { ...options, show, filters };
            return { query, options: currentOptions };
          }),
        ),
      ),
      switchMap(({ query, options }) => search(query, options)),
    )
    .subscribe((results) => nucliaStore().searchResults.next(results));
};
