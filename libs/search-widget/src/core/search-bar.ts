import { distinctUntilChanged, filter, map, switchMap, take, tap } from 'rxjs/operators';
import { search } from './api';
import { navigateToLink } from './stores/widget.store';
import type { Search } from '@nuclia/core';
import { ResourceProperties } from '@nuclia/core';
import { forkJoin, Subscription } from 'rxjs';
import {
  isEmptySearchQuery,
  loadMore,
  pendingResults,
  searchFilters,
  searchOptions,
  searchQuery,
  searchResults,
  triggerSearch,
} from './stores/search.store';
import { ask } from './stores/effects';

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
        tap(() => pendingResults.set(true)),
        switchMap((trigger) =>
          isEmptySearchQuery.pipe(
            take(1),
            filter((isEmptySearchQuery) => !isEmptySearchQuery),
            switchMap(() => searchQuery.pipe(take(1))),
            tap((query) => (dispatch ? dispatch('search', query) : undefined)),
            switchMap((query) =>
              forkJoin([searchOptions.pipe(take(1)), searchFilters.pipe(take(1)), navigateToLink.pipe(take(1))]).pipe(
                map(([options, filters, navigateToLink]) => {
                  // We need to load the values in order to then choose the tiles depending on the field type
                  // Once we will have search v2, we should load Values only for navigateToLink
                  const show = navigateToLink
                    ? [ResourceProperties.BASIC, ResourceProperties.VALUES]
                    : [ResourceProperties.BASIC, ResourceProperties.VALUES];
                  show.push(ResourceProperties.VALUES);
                  const currentOptions = { ...options, show, filters };
                  return { query, options: currentOptions };
                }),
              ),
            ),
            tap(({ query }) => ask.next({ question: query, reset: true })),
            switchMap(({ query, options }) =>
              search(query, options).pipe(map((results) => ({ results, append: !!trigger?.more }))),
            ),
          ),
        ),
      )
      .subscribe(({ results, append }) => searchResults.set({ results, append })),
  );

  if (typeof dispatch === 'function') {
    subscriptions.push(searchResults.subscribe((results) => dispatch('results', results)));
  }

  subscriptions.push(
    loadMore
      .pipe(
        filter((page) => !!page),
        distinctUntilChanged(),
      )
      .subscribe(() => {
        triggerSearch.next({ more: true });
      }),
  );
};
