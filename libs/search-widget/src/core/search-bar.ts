import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { PENDING_RESULTS } from './models';
import { search } from './api';
import { navigateToLink } from './stores/widget.store';
import { ResourceProperties, Search } from '@nuclia/core';
import { forkJoin, Subscription } from 'rxjs';
import {
  isEmptySearchQuery,
  searchFilters,
  searchOptions,
  searchQuery,
  searchResults,
  triggerSearch,
} from './stores/search.store';

const subscriptions: Subscription[] = [];

export function unsubscribeTriggerSearch() {
  subscriptions.forEach((subscription) => subscription.unsubscribe());
}

export const setupTriggerSearch = (
  dispatch: (event: string, details: string | Search.Results) => void | undefined,
): void => {
  subscriptions.push(
    triggerSearch
      .pipe(
        tap(() => searchResults.set(PENDING_RESULTS)),
        switchMap(() => isEmptySearchQuery.pipe(take(1))),
        filter((isEmptySearchQuery) => !isEmptySearchQuery),
        switchMap(() => searchQuery.pipe(take(1))),
        tap((query) => (dispatch ? dispatch('search', query) : undefined)),
        switchMap((query) =>
          forkJoin([searchOptions.pipe(take(1)), searchFilters.pipe(take(1)), navigateToLink.pipe(take(1))]).pipe(
            map(([options, filters, navigateToLink]) => {
              const show = navigateToLink
                ? [ResourceProperties.BASIC, ResourceProperties.VALUES, ResourceProperties.ORIGIN]
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
      .subscribe((results) => searchResults.set(results)),
  );
};
