import { distinctUntilChanged, filter, map, switchMap, take, tap } from 'rxjs/operators';
import { search } from './api';
import type { Chat, ChatOptions, Search, SearchOptions } from '@nuclia/core';
import { forkJoin, Subscription } from 'rxjs';
import {
  askQuestion,
  autofilerDisabled,
  disableAnswers,
  hideResults,
  isAnswerEnabled,
  isEmptySearchQuery,
  loadMore,
  pageNumber,
  pendingResults,
  preselectedFilters,
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
  widgetRagStrategies,
} from './stores';
import { NO_RESULT_LIST } from './models';

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
        switchMap((trigger) =>
          isEmptySearchQuery.pipe(
            take(1),
            filter((isEmptySearchQuery) => !isEmptySearchQuery),
            switchMap(() => searchQuery.pipe(take(1))),
            tap((query) => (dispatch ? dispatch('search', query) : undefined)),
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
                preselectedFilters.pipe(take(1)),
                autofilerDisabled.pipe(take(1)),
                isAnswerEnabled.pipe(take(1)),
                widgetRagStrategies.pipe(take(1)),
                widgetImageRagStrategies.pipe(take(1)),
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
                    preselectedFilters,
                    autoFilterDisabled,
                    isAnswerEnabled,
                    ragStrategies,
                    ragImageStrategies,
                  ]) => {
                    const currentOptions: SearchOptions = {
                      ...options,
                      show,
                      filters: filters.concat(preselectedFilters),
                      ...(autoFilterDisabled ? { autofilter: false } : {}),
                    };
                    if (isAnswerEnabled && !trigger?.more) {
                      const chatOptions: ChatOptions = currentOptions;
                      if (ragStrategies.length > 0) {
                        chatOptions.rag_strategies = ragStrategies;
                      }
                      if (ragImageStrategies.length > 0) {
                        chatOptions.rag_images_strategies = ragImageStrategies;
                      }
                      return askQuestion(query, true, chatOptions).pipe(
                        tap((res) => {
                          if (res.type === 'error' && res.status === 402 && !hideResults) {
                            disableAnswers();
                            triggerSearch.next();
                          }
                        }),
                        filter((res) => res.type !== 'error'),
                        map((res) => res as Chat.Answer),
                        // Chat is emitting several times until the answer is complete, but the result sources doesn't change while answer is incomplete
                        // So we make sure to emit only when results are changing, preventing to write in the state several times while loading the answer
                        distinctUntilChanged((previous, current) => previous.sources === current.sources),
                        map((res) => ({
                          results: res.sources,
                          append: false,
                          hideResults,
                          loadingMore: false,
                          options: currentOptions,
                        })),
                      );
                    } else {
                      return search(query, currentOptions).pipe(
                        map((results) => ({
                          results,
                          append: !!trigger?.more,
                          hideResults,
                          loadingMore: trigger?.more,
                          options: currentOptions,
                        })),
                      );
                    }
                  },
                ),
              ),
            ),
          ),
        ),
      )
      .subscribe(({ results, append, hideResults, loadingMore, options }) => {
        if (results && results.total === 0 && options.autofilter && (results.autofilters || []).length > 0) {
          // If autofilter is enabled and no results are found, retry without autofilters
          autofilerDisabled.set(true);
          triggerSearch.next(loadingMore ? { more: true } : undefined);
        } else if (results) {
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
        filter((page) => !!page),
        distinctUntilChanged(),
      )
      .subscribe(() => {
        triggerSearch.next({ more: true });
      }),
  );
};
