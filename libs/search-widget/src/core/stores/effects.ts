import { getLabelSets, predict, suggest } from '../api';
import { labelSets } from './labels.store';
import { suggestions, typeAhead } from './suggestions.store';
import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  forkJoin,
  map,
  merge,
  Observable,
  of,
  skip,
  Subscription,
  switchMap,
  take,
} from 'rxjs';
import { NO_RESULTS } from '../models';
import { widgetFeatures, widgetMode } from './widget.store';
import { isPopupSearchOpen } from './modal.store';
import type { Classification, Search } from '@nuclia/core';
import { formatQueryKey, updateQueryParams } from '../utils';
import { isEmptySearchQuery, searchFilters, searchQuery, triggerSearch } from './search.store';

const subscriptions: Subscription[] = [];

export function unsubscribeAllEffects() {
  subscriptions.forEach((subscription) => subscription.unsubscribe());
}

/**
 * Initialise label sets in the store
 */
export function initLabelStore() {
  // getLabelSets is making a http call, so this observable will complete and there is no need to unsubscribe.
  getLabelSets().subscribe((labelSetMap) => labelSets.set(labelSetMap));
}

/**
 * Subscribe to type ahead, call suggest and predict with the query and set suggestions in the state accordingly.
 */
export function activateTypeAheadSuggestions() {
  const subscription = merge(
    // Trigger suggestion when hitting space between words
    typeAhead.pipe(filter((query) => !!query && query.slice(-1) === ' ' && query.slice(-2, -1) !== ' ')),
    // Trigger suggestion after 350ms of inactivity
    typeAhead.pipe(debounceTime(350)),
  )
    .pipe(
      // Don't trigger suggestion after inactivity if only spaces were added at the end of the query
      distinctUntilChanged((previous, current) => previous === current),
      switchMap((query) => {
        if (!query || query.length <= 2) {
          return of({
            results: NO_RESULTS,
          });
        }
        const requests: [Observable<Search.Suggestions>, Observable<Classification[]>] = widgetFeatures.getValue()
          ?.suggestLabels
          ? [suggest(query), predict(query)]
          : [suggest(query), of([])];
        return forkJoin(requests).pipe(
          map(([results, predictions]) => ({
            results,
            labels: predictions,
          })),
        );
      }),
    )
    .subscribe((suggestionList) => suggestions.set(suggestionList));

  subscriptions.push(subscription);
}

/**
 * Initialise permalink feature
 */
export function activatePermalinks() {
  const queryKey = formatQueryKey('query');
  const filterKey = formatQueryKey('filter');

  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get(queryKey);
  const filters = urlParams.getAll(filterKey);
  if (query || filters.length > 0) {
    searchQuery.set(query || '');
    searchFilters.set(filters);
    typeAhead.set(query || '');
    triggerSearch.next();
    if (widgetMode.value === 'popup') {
      isPopupSearchOpen.set(true);
    }
  }

  const permalinkSubscription = [
    // When a search is performed, save the query and filters in the current URL
    triggerSearch
      .pipe(
        switchMap(() => isEmptySearchQuery.pipe(take(1))),
        filter((isEmptySearchQuery) => !isEmptySearchQuery),
        switchMap(() => combineLatest([searchQuery, searchFilters]).pipe(take(1))),
      )
      .subscribe(([query, filters]) => {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set(queryKey, query);
        urlParams.delete(filterKey);
        filters.forEach((filter) => urlParams.append(filterKey, filter));
        updateQueryParams(urlParams);
      }),
    // Remove parameters from the URL when search results are reset
    merge(
      isPopupSearchOpen.pipe(
        distinctUntilChanged(),
        skip(1),
        filter((isOpen) => !isOpen),
      ),
      isEmptySearchQuery.pipe(
        distinctUntilChanged(),
        skip(1),
        filter((isEmpty) => isEmpty),
      ),
    ).subscribe(() => {
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.delete(queryKey);
      urlParams.delete(filterKey);
      updateQueryParams(urlParams);
    }),
  ];

  subscriptions.push(...permalinkSubscription);
}
