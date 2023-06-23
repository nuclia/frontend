import {
  getAnswer,
  getEntities,
  getEvents,
  getLabelSets,
  getResourceField,
  predict,
  searchInResource,
  suggest,
} from '../api';
import { labelSets, labelState } from './labels.store';
import { Suggestions, suggestions, suggestionState, triggerSuggestions, typeAhead } from './suggestions.store';
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
  Subject,
  Subscription,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { NO_SUGGESTION_RESULTS } from '../models';
import { widgetFeatures } from './widget.store';
import type { BaseSearchOptions, Chat, Classification, FieldFullId, IErrorResponse, Search } from '@nuclia/core';
import { getFieldTypeFromString } from '@nuclia/core';
import { formatQueryKey, getUrlParams, updateQueryParams } from '../utils';
import {
  isEmptySearchQuery,
  isTitleOnly,
  searchFilters,
  searchQuery,
  searchState,
  trackingEngagement,
  triggerSearch,
} from './search.store';
import { fieldData, fieldFullId, viewerState } from './viewer.store';
import { answerState, chat, chatError, currentAnswer, currentQuestion } from './answers.store';
import { graphSearchResults, graphSelection, graphState } from './graph.store';
import type { NerNode } from '../knowledge-graph.models';
import { entities, entitiesState } from './entities.store';
import { viewerSearchState } from './viewer-search.store';
import { unsubscribeTriggerSearch } from '../search-bar';
import { logEvent } from '../tracking';

const subscriptions: Subscription[] = [];

export function resetStatesAndEffects() {
  subscriptions.forEach((subscription) => subscription.unsubscribe());
  unsubscribeTriggerSearch();
  answerState.reset();
  entitiesState.reset();
  graphState.reset();
  labelState.reset();
  searchState.reset();
  suggestionState.reset();
  viewerState.reset();
  viewerSearchState.reset();
}

/**
 * Initialise label sets in the store
 */
export function initLabelStore() {
  // getLabelSets is making a http call, so this observable will complete and there is no need to unsubscribe.
  getLabelSets().subscribe((labelSetMap) => labelSets.set(labelSetMap));
}
export function initEntitiesStore() {
  getEntities().subscribe((entityMap) => entities.set(entityMap));
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
            results: NO_SUGGESTION_RESULTS,
          } as Suggestions);
        }
        const requests: [Observable<Search.Suggestions | IErrorResponse>, Observable<Classification[]>] =
          widgetFeatures.getValue()?.suggestLabels ? [suggest(query), predict(query)] : [suggest(query), of([])];
        return forkJoin(requests).pipe(
          map(([results, predictions]) => ({
            results: results.type !== 'error' ? results : NO_SUGGESTION_RESULTS,
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
const titleOnlyKey = formatQueryKey('titleOnly');
const previewKey = formatQueryKey('preview');

/**
 * Initialise answer feature
 */

export const ask = new Subject<{ question: string; reset: boolean }>();

export function initAnswer() {
  subscriptions.push(
    ask
      .pipe(
        distinctUntilChanged(),
        switchMap(({ question, reset }) => askQuestion(question, reset)),
      )
      .subscribe(),
  );
}

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
        switchMap(() => combineLatest([searchQuery, searchFilters, isTitleOnly]).pipe(take(1))),
      )
      .subscribe(([query, filters, isTitleOnly]) => {
        const urlParams = getUrlParams();
        urlParams.set(queryKey, query);
        urlParams.delete(filterKey);
        urlParams.delete(titleOnlyKey);
        filters.forEach((filter) => urlParams.append(filterKey, filter));
        urlParams.append(titleOnlyKey, `${isTitleOnly}`);
        updateQueryParams(urlParams);
      }),
    // Remove search parameters from the URL when search results are reset
    isEmptySearchQuery
      .pipe(
        distinctUntilChanged(),
        skip(1),
        filter((isEmpty) => isEmpty),
      )
      .subscribe(() => {
        const urlParams = getUrlParams();
        urlParams.delete(queryKey);
        urlParams.delete(filterKey);
        urlParams.delete(titleOnlyKey);
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
        const urlParams = getUrlParams();
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
        const urlParams = getUrlParams();
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
  const urlParams = getUrlParams();
  // Search store
  const query = urlParams.get(queryKey);
  const titleOnly = urlParams.get(titleOnlyKey) === 'true';
  const filters = urlParams.getAll(filterKey);

  if (query || filters.length > 0) {
    searchQuery.set(query || '');
    searchFilters.set({ filters, titleOnly });
    typeAhead.set(query || '');
    triggerSearch.next();
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
export function initViewer() {
  const subscription = fieldFullId
    .pipe(
      distinctUntilChanged(),
      switchMap((fullId) => {
        if (fullId) {
          // load in 2 passes so we get the field value fast, so we can render the tile
          // and then get the field extracted metadata later (as it is much bigger)
          // TODO: reconsider when https://app.shortcut.com/flaps/story/4190/option-to-not-load-ners-related-data-when-getting-a-field
          // is done (maybe a unique pass will be better then)
          return getResourceField(fullId, true).pipe(
            tap((resourceField) => fieldData.set(resourceField)),
            switchMap(() => getResourceField(fullId, false)),
            tap((resourceField) => fieldData.set(resourceField)),
          );
        } else {
          return of(null);
        }
      }),
    )
    .subscribe();
  subscriptions.push(subscription);
}

export function setupTriggerGraphNerSearch() {
  subscriptions.push(
    combineLatest([
      graphSelection.pipe(
        distinctUntilChanged(),
        filter((node) => !!node),
        map((node) => node as NerNode),
      ),
      fieldFullId.pipe(
        distinctUntilChanged(),
        filter((id) => !!id),
        map((id) => id as FieldFullId),
      ),
    ])
      .pipe(
        switchMap(
          ([node, fullId]) => searchInResource(`"${node.ner}"`, { id: fullId.resourceId }, {}),
          // FIXME: here's the proper call once the following bug is fixed: https://app.shortcut.com/flaps/story/5365/searching-on-resource-using-filtering-on-entity-always-returns-the-same-results
          // searchInResource('', { id: fullId.resourceId }, { filters: [`/e/${node.family}/${node.ner}`] }),
        ),
      )
      .subscribe((results) => graphSearchResults.set(results)),
  );
}

export function askQuestion(
  question: string,
  reset: boolean,
  options: BaseSearchOptions = {},
): Observable<{ question: string; answer: Chat.Answer }> {
  return of({ question, reset }).pipe(
    tap((data) => currentQuestion.set(data)),
    switchMap(({ question }) =>
      chat.pipe(
        take(1),
        map((chat) => chat.filter((chat) => !chat.answer.incomplete)),
        switchMap((entries) =>
          searchFilters.pipe(
            take(1),
            switchMap((filters) =>
              getAnswer(question, entries, { ...options, filters }).pipe(
                tap((result) => {
                  if (result.type === 'error') {
                    chatError.set(result);
                  } else {
                    if (result.incomplete) {
                      currentAnswer.set(result);
                    } else {
                      chat.set({ question, answer: result });
                    }
                  }
                }),
                filter((result) => result.type !== 'error'),
                map((answer) => answer as Chat.Answer),
                map((answer) => ({ question, answer })),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

export function initUsageTracking() {
  subscriptions.push(
    trackingEngagement
      .pipe(
        distinctUntilChanged(),
        filter((engagement) => Object.keys(engagement).length > 0),
      )
      .subscribe((engagement) => logEvent('engage', { ...engagement })),
  );
}
