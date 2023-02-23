import { getLabelSets, getResourceField, predict, suggest } from '../api';
import { labelSets } from './labels.store';
import { suggestions, triggerSuggestions, typeAhead } from './suggestions.store';
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
import { FieldFullId, NO_RESULTS } from '../models';
import { widgetFeatures, widgetMode } from './widget.store';
import { isPopupSearchOpen } from './modal.store';
import type { Classification, Search } from '@nuclia/core';
import { getFieldTypeFromString } from '@nuclia/core';
import { formatQueryKey, updateQueryParams } from '../utils';
import { isEmptySearchQuery, searchFilters, searchQuery, triggerSearch } from './search.store';
import { fieldData, fieldFullId, resourceTitle } from './viewer.store';

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
  const query = triggerSuggestions.pipe(switchMap(() => typeAhead.pipe(take(1))));
  const subscription = merge(
    // Trigger suggestion when hitting space between words
    query.pipe(filter((query) => !!query && query.slice(-1) === ' ' && query.slice(-2, -1) !== ' ')),
    // Trigger suggestion after 350ms of inactivity
    query.pipe(debounceTime(350)),
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

const queryKey = formatQueryKey('query');
const filterKey = formatQueryKey('filter');
const previewKey = formatQueryKey('preview');

/**
 * Initialise permalink feature
 */
export function activatePermalinks() {
  initStoreFromUrlParams();

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
    // Remove search parameters from the URL when search results are reset
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
    // Add current field id in the URL when preview is open
    fieldFullId
      .pipe(
        distinctUntilChanged(),
        filter((fullId) => !!fullId),
      )
      .subscribe((fullId) => {
        const previewId = `${fullId?.resourceId}|${fullId?.field_type}|${fullId?.field_id}`;
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set(previewKey, previewId);
        updateQueryParams(urlParams);
      }),
    //Remove preview parameters from the URL when preview is closed
    fieldFullId
      .pipe(
        distinctUntilChanged(),
        filter((fullId) => !fullId),
      )
      .subscribe(() => {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.delete(previewKey);
        updateQueryParams(urlParams);
      }),
  ];

  subscriptions.push(...permalinkSubscription);
}

/**
 * Check URL params and set store from them
 */
function initStoreFromUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  // Search store
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

  // Viewer store
  const preview = urlParams.get(previewKey);
  if (preview) {
    const [resourceId, type, field_id] = preview.split('|');
    const field_type = getFieldTypeFromString(type);
    if (resourceId && field_type && field_id) {
      fieldFullId.set({ resourceId, field_type, field_id });
    }
  }
}

// Load field data when fieldFullId is set
export function loadFieldData() {
  const subscription = fieldFullId
    .pipe(
      distinctUntilChanged(),
      switchMap((fullId) => {
        if (fullId) {
          return getResourceField(fullId);
        } else {
          return of(null);
        }
      }),
    )
    .subscribe((resourceField) => {
      fieldData.set(resourceField);
    });
  subscriptions.push(subscription);
}
