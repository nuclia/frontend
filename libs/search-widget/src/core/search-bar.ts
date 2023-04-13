import { distinctUntilChanged, filter, map, switchMap, take, tap } from 'rxjs/operators';
import { search } from './api';
import type { Search, SearchOptions } from '@nuclia/core';
import { ResourceProperties } from '@nuclia/core';
import { forkJoin, Subscription } from 'rxjs';
import {
  isEmptySearchQuery,
  labelFilters,
  loadMore,
  pendingResults,
  searchFilters,
  searchOptions,
  searchQuery,
  searchResults,
  triggerSearch,
} from './stores/search.store';
import { ask } from './stores/effects';
import { isTitleOnly } from '../common/label/label.utils';

const subscriptions: Subscription[] = [];

export function unsubscribeTriggerSearch() {
  subscriptions.forEach((subscription) => subscription.unsubscribe());
}

export const setupTriggerSearch = (
  dispatch: (event: string, details: string | Search.Results | Search.FindResults) => void | undefined,
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
              forkJoin([searchOptions.pipe(take(1)), searchFilters.pipe(take(1)), labelFilters.pipe(take(1))]).pipe(
                map(([options, filters, labelFilters]) => {
                  const show = [ResourceProperties.BASIC, ResourceProperties.VALUES, ResourceProperties.ORIGIN];
                  const currentOptions: SearchOptions = {
                    ...options,
                    show,
                    filters,
                    inTitleOnly: isTitleOnly(query, labelFilters),
                  };
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
