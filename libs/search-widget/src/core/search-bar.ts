import { distinctUntilChanged, filter, map, mergeMap, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { getAnswer } from './api';
import type { Ask, ChatOptions, Search, SearchOptions } from '@nuclia/core';
import { forkJoin, Subscription } from 'rxjs';
import {
  askQuestion,
  combinedFilterExpression,
  combinedFilters,
  disableAnswers,
  filterExpression,
  getSearchResults,
  hideResults,
  isAnswerEnabled,
  isEmptySearchQuery,
  loadMore,
  pageNumber,
  pendingResults,
  preferMarkdown,
  rangeCreationISO,
  searchConfigId,
  searchFilters,
  searchOptions,
  searchQuery,
  searchResults,
  searchShow,
  trackingResultsReceived,
  trackingSearchId,
  trackingStartTime,
  triggerSearch,
  widgetImageRagStrategies,
  widgetJsonSchema,
  widgetRagStrategies,
} from './stores';
import { NO_RESULT_LIST } from './models';

const subscriptions: Subscription[] = [];

export function unsubscribeTriggerSearch() {
  subscriptions.forEach((subscription) => subscription.unsubscribe());
}

export const setupTriggerSearch = (
  dispatch: (event: string, details: { query: string; filters: string[] } | Search.FindResults) => void | undefined,
): void => {
  subscriptions.push(
    triggerSearch
      .pipe(
        mergeMap((trigger) =>
          isEmptySearchQuery.pipe(
            take(1),
            filter((isEmptySearchQuery) => !isEmptySearchQuery),
            switchMap(() => searchQuery.pipe(take(1))),
            tap(() => {
              if (!trigger?.more) {
                pageNumber.set(0);
                trackingStartTime.set(Date.now());
                searchResults.set({ results: NO_RESULT_LIST, append: false });
              }
            }),
            switchMap((query) =>
              forkJoin([
                hideResults.pipe(take(1)),
                searchOptions.pipe(take(1)),
                searchShow.pipe(take(1)),
                searchFilters.pipe(take(1)),
                combinedFilters.pipe(take(1)),
                combinedFilterExpression.pipe(take(1)),
                filterExpression.pipe(take(1)),
                rangeCreationISO.pipe(take(1)),
                isAnswerEnabled.pipe(take(1)),
                widgetRagStrategies.pipe(take(1)),
                widgetImageRagStrategies.pipe(take(1)),
                preferMarkdown.pipe(take(1)),
                widgetJsonSchema.pipe(take(1)),
                searchConfigId.pipe(take(1)),
              ]).pipe(
                tap(() => {
                  pendingResults.set(true);
                }),
                switchMap(
                  ([
                    hideResults,
                    options,
                    show,
                    filters,
                    combinedFilters,
                    combinedFilterExpression,
                    filterExpression,
                    rangeCreation,
                    isAnswerEnabled,
                    ragStrategies,
                    ragImageStrategies,
                    preferMarkdown,
                    jsonSchema,
                    searchConfigId,
                  ]) => {
                    dispatch('search', { query, filters });
                    const currentOptions: SearchOptions = {
                      ...options,
                      show,
                      filters: filterExpression ? undefined : combinedFilters,
                      filter_expression: filterExpression ? combinedFilterExpression : undefined,
                      range_creation_start: !filterExpression ? rangeCreation?.start : undefined,
                      range_creation_end: !filterExpression ? rangeCreation?.end : undefined,
                    };
                    if (isAnswerEnabled && !trigger?.more) {
                      const chatOptions: ChatOptions = currentOptions;
                      if (ragStrategies.length > 0) {
                        chatOptions.rag_strategies = ragStrategies;
                      }
                      if (ragImageStrategies.length > 0) {
                        chatOptions.rag_images_strategies = ragImageStrategies;
                      }
                      if (preferMarkdown) {
                        chatOptions.prefer_markdown = preferMarkdown;
                      }
                      if (jsonSchema) {
                        chatOptions.answer_json_schema = jsonSchema;
                      }
                      return askQuestion(query, true, chatOptions).pipe(
                        tap((res) => {
                          if (res.type === 'error' && res.status === 402 && !hideResults) {
                            disableAnswers();
                            triggerSearch.next();
                          }
                        }),
                        filter((res) => res.type !== 'error'),
                        map((res) => res as Ask.Answer),
                        // Chat is emitting several times until the answer is complete, but the result sources doesn't change while answer is incomplete
                        // So we make sure to emit only when results are changing, preventing to write in the state several times while loading the answer
                        distinctUntilChanged(
                          (previous, current) =>
                            Object.keys(previous.sources || {}).length === Object.keys(current.sources || {}).length,
                        ),
                        map((res) => ({
                          results: res.sources,
                          append: false,
                          hideResults,
                          loadingMore: false,
                        })),
                      );
                    } else if (isAnswerEnabled && searchConfigId && trigger?.more) {
                      // If search configuration kind is "ask", then additional search results must be retrieved using /ask instead of /find
                      const chatOptions: ChatOptions = {
                        ...currentOptions,
                        generative_model: 'generative-multilingual-2023',
                        search_configuration: searchConfigId,
                        synchronous: true,
                      };
                      return getAnswer(query, undefined, chatOptions).pipe(
                        filter((res) => res.type !== 'error'),
                        map((res) => ({
                          results: res.sources,
                          append: true,
                          hideResults,
                          loadingMore: true,
                        })),
                      );
                    } else {
                      return getSearchResults(query, currentOptions, !!trigger?.more).pipe(
                        map((results) => ({
                          results,
                          append: !!trigger?.more,
                          hideResults,
                          loadingMore: trigger?.more,
                        })),
                      );
                    }
                  },
                ),
                // Stop current search when a new search is made
                takeUntil(triggerSearch.pipe(filter((data) => !data?.more))),
              ),
            ),
          ),
        ),
      )
      .subscribe(({ results, append, hideResults, loadingMore }) => {
        if (results) {
          if (isAnswerEnabled && !loadingMore) {
            if (!hideResults) {
              trackingSearchId.set(results.searchId);
              searchResults.set({ results: results, append: false });
            }
          } else {
            if (!append) {
              trackingSearchId.set(results.searchId);
            }
            searchResults.set({ results, append });
          }
          trackingResultsReceived.set(true);
        }
      }),
  );

  if (typeof dispatch === 'function') {
    subscriptions.push(searchResults.subscribe((results) => dispatch('results', results)));
  }

  subscriptions.push(
    loadMore
      .pipe(
        distinctUntilChanged(),
        filter((page) => page > 0),
      )
      .subscribe(() => {
        triggerSearch.next({ more: true });
      }),
  );
};
