import {
  getAnswer,
  getEntities,
  getLabelSets,
  getResourceById,
  getResourceField,
  predict,
  searchInResource,
  suggest,
} from '../api';
import { labelSets, labelState } from './labels.store';
import type { Suggestions } from './suggestions.store';
import { suggestions, suggestionState, triggerSuggestions, typeAhead } from './suggestions.store';
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
import type { TypedResult } from '../models';
import { NO_SUGGESTION_RESULTS } from '../models';
import { widgetFeatures, widgetImageRagStrategies, widgetRagStrategies } from './widget.store';
import type {
  BaseSearchOptions,
  Chat,
  ChatOptions,
  Classification,
  FieldFullId,
  IErrorResponse,
  Search,
} from '@nuclia/core';
import { getFieldTypeFromString, ResourceProperties } from '@nuclia/core';
import { formatQueryKey, getFindParagraphs, getUrlParams, updateQueryParams } from '../utils';
import {
  creationEnd,
  creationStart,
  getFieldDataFromResource,
  getResultType,
  isEmptySearchQuery,
  isTitleOnly,
  pendingResults,
  preselectedFilters,
  resultList,
  searchFilters,
  searchQuery,
  searchState,
  trackingEngagement,
  triggerSearch,
} from './search.store';
import { fieldData, fieldFullId, viewerData, viewerState } from './viewer.store';
import { answerState, chat, chatError, currentAnswer, currentQuestion } from './answers.store';
import { graphSearchResults, graphSelection, graphState } from './graph.store';
import type { NerNode } from '../knowledge-graph.models';
import { entities, entitiesState } from './entities.store';
import { unsubscribeTriggerSearch } from '../search-bar';
import { logEvent } from '../tracking';
import { translateInstant } from '../i18n';
import { reset } from '../reset';

const subscriptions: Subscription[] = [];

function resetStatesAndEffects() {
  subscriptions.forEach((subscription) => subscription.unsubscribe());
  unsubscribeTriggerSearch();
  answerState.reset();
  entitiesState.reset();
  graphState.reset();
  labelState.reset();
  searchState.reset();
  suggestionState.reset();
  viewerState.reset();
}

reset.subscribe(() => resetStatesAndEffects());

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
const creationStartKey = formatQueryKey('creationStart');
const creationEndKey = formatQueryKey('creationEnd');

/**
 * Initialise answer feature
 */

export const ask = new Subject<{ question: string; reset: boolean }>();

export function initAnswer() {
  subscriptions.push(
    ask
      .pipe(
        distinctUntilChanged(),
        switchMap(({ question, reset }) =>
          forkJoin([widgetRagStrategies.pipe(take(1)), widgetImageRagStrategies.pipe(take(1))]).pipe(
            switchMap(([ragStrategies, ragImageStrategies]) => {
              const chatOptions: ChatOptions = {};
              if (ragStrategies.length > 0) {
                chatOptions.rag_strategies = ragStrategies;
                chatOptions.rag_images_strategies = ragImageStrategies;
              }
              return askQuestion(question, reset, chatOptions);
            }),
          ),
        ),
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
        switchMap(() =>
          combineLatest([searchQuery, searchFilters, isTitleOnly, creationStart, creationEnd]).pipe(take(1)),
        ),
      )
      .subscribe(([query, filters, isTitleOnly, creationStart, creationEnd]) => {
        const urlParams = getUrlParams();
        urlParams.set(queryKey, query);
        urlParams.delete(filterKey);
        urlParams.delete(titleOnlyKey);
        urlParams.delete(creationStartKey);
        urlParams.delete(creationEndKey);
        filters.forEach((filter) => urlParams.append(filterKey, filter));
        urlParams.append(titleOnlyKey, `${isTitleOnly}`);
        if (creationStart) urlParams.append(creationStartKey, creationStart);
        if (creationEnd) urlParams.append(creationEndKey, creationEnd);
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
        urlParams.delete(creationStartKey);
        urlParams.delete(creationEndKey);
        updateQueryParams(urlParams);
      }),
    // Add current field id in the URL when preview is open
    viewerData
      .pipe(
        distinctUntilChanged(),
        filter((data) => !!data.fieldFullId),
      )
      .subscribe((viewerState) => {
        const previewId = `${viewerState.fieldFullId?.resourceId}|${viewerState.fieldFullId?.field_type}|${viewerState.fieldFullId?.field_id}`;
        const selectedIndex = `${viewerState.selectedParagraphIndex}`;
        const urlParams = getUrlParams();
        urlParams.set(previewKey, `${previewId}|${selectedIndex}`);
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
  const start = urlParams.get(creationStartKey);
  const end = urlParams.get(creationEndKey);

  if (query || filters.length > 0 || start || end) {
    searchQuery.set(query || '');
    searchFilters.set({ filters, titleOnly });
    typeAhead.set(query || '');
    creationStart.set(start || undefined);
    creationEnd.set(end || undefined);
    triggerSearch.next();
  }

  // Viewer store
  const preview = urlParams.get(previewKey);
  if (preview) {
    const [resourceId, type, field_id, selectedIndex] = preview.split('|');
    const field_type = getFieldTypeFromString(type);
    if (resourceId && field_type && field_id) {
      resultList
        .pipe(
          take(1),
          switchMap((list) => {
            if (list.length > 0) {
              const previewResult = list.find(
                (item) =>
                  item.id === resourceId && item.field?.field_id === field_id && item.field.field_type === field_type,
              );
              return of(previewResult);
            } else {
              return getResourceById(resourceId, [
                ResourceProperties.BASIC,
                ResourceProperties.ORIGIN,
                ResourceProperties.VALUES,
              ]).pipe(
                map((resource) => {
                  const field = { field_id, field_type };
                  const fieldResult = { ...resource, field, fieldData: getFieldDataFromResource(resource, field) };
                  const { resultType, resultIcon } = getResultType(fieldResult);
                  const result: TypedResult = {
                    ...fieldResult,
                    resultType,
                    resultIcon,
                  };
                  return result;
                }),
              );
            }
          }),
        )
        .subscribe((previewResult: TypedResult | undefined) => {
          const index = selectedIndex !== 'null' ? parseInt(selectedIndex, 10) : -1;
          if (previewResult) {
            viewerData.set({
              result: previewResult,
              selectedParagraphIndex: index,
            });
          }
        });
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
          return getResourceField(fullId).pipe(tap((resourceField) => fieldData.set(resourceField)));
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
        switchMap(([node, fullId]) =>
          // FIXME: here's the proper call once the following bug is fixed: https://app.shortcut.com/flaps/story/5365/searching-on-resource-using-filtering-on-entity-always-returns-the-same-results
          // searchInResource('', { id: fullId.resourceId }, { filters: [`/e/${node.family}/${node.ner}`] }),
          searchInResource(`"${node.ner}"`, { id: fullId.resourceId }, {}).pipe(
            map((results) => getFindParagraphs(results, fullId)),
          ),
        ),
      )
      .subscribe((paragraphs) => graphSearchResults.set(paragraphs)),
  );
}

export function askQuestion(
  question: string,
  reset: boolean,
  options: BaseSearchOptions = {},
): Observable<Chat.Answer | IErrorResponse> {
  return of({ question, reset }).pipe(
    tap((data) => currentQuestion.set(data)),
    switchMap(({ question }) =>
      chat.pipe(
        take(1),
        map((chat) => chat.filter((chat) => !chat.answer.incomplete && !chat.answer.inError)),
        switchMap((entries) =>
          combineLatest([searchFilters.pipe(take(1)), preselectedFilters.pipe(take(1))]).pipe(
            switchMap(([filters, preselectedFilters]) =>
              getAnswer(question, entries, { ...options, filters: filters.concat(preselectedFilters) }).pipe(
                tap((result) => {
                  if (result.type === 'error') {
                    if ([412, 529].includes(result.status)) {
                      chat.set({
                        question,
                        answer: {
                          inError: true,
                          text: translateInstant('answer.error.rephrasing'),
                          type: 'answer',
                          id: '',
                        },
                      });
                    } else {
                      chatError.set(result);
                    }
                    pendingResults.set(false);
                  } else {
                    if (result.incomplete) {
                      currentAnswer.set(result);
                    } else {
                      chat.set({ question, answer: result });
                      pendingResults.set(false);
                    }
                  }
                }),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

export function initUsageTracking(noTracking?: boolean) {
  if (!noTracking) {
    subscriptions.push(
      trackingEngagement
        .pipe(
          distinctUntilChanged(),
          filter((engagement) => Object.keys(engagement).length > 0),
        )
        .subscribe((engagement) => logEvent('engage', { ...engagement })),
    );
  }
}
