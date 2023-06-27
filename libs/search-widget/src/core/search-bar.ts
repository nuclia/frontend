import { distinctUntilChanged, filter, map, switchMap, take, tap } from 'rxjs/operators';
import { search } from './api';
import type { Chat, Search, SearchOptions } from '@nuclia/core';
import { ResourceProperties } from '@nuclia/core';
import { forkJoin, Subscription } from 'rxjs';
import {
  autofilerDisabled,
  isEmptySearchQuery,
  isTitleOnly,
  loadMore,
  pageNumber,
  pendingResults,
  searchFilters,
  searchOptions,
  searchQuery,
  searchResults,
  trackingResultsReceived,
  trackingSearchId,
  trackingStartTime,
  triggerSearch,
} from './stores/search.store';
import { askQuestion } from './stores/effects';
import { disableAnswers, isAnswerEnabled, onlyAnswers } from './stores/widget.store';

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
            tap((query) => {
              if (!trigger?.more) {
                pageNumber.set(0);
                trackingStartTime.set(Date.now());
              }
            }),
            switchMap((query) =>
              forkJoin([
                onlyAnswers.pipe(take(1)),
                searchOptions.pipe(take(1)),
                searchFilters.pipe(take(1)),
                isTitleOnly.pipe(take(1)),
                autofilerDisabled.pipe(take(1)),
                isAnswerEnabled.pipe(take(1)),
              ]).pipe(
                tap(([onlyAnswers]) => {
                  if (!onlyAnswers) {
                    pendingResults.set(true);
                  }
                }),
                switchMap(([onlyAnswers, options, filters, inTitleOnly, autofilerDisabled, isAnswerEnabled]) => {
                  const show = [ResourceProperties.BASIC, ResourceProperties.VALUES, ResourceProperties.ORIGIN];
                  const currentOptions: SearchOptions = {
                    ...options,
                    show,
                    filters,
                    inTitleOnly,
                    ...(autofilerDisabled ? { autofilter: false } : {}),
                  };
                  if (isAnswerEnabled && !trigger?.more) {
                    return askQuestion(query, true, currentOptions).pipe(
                      tap((res) => {
                        if (res.type === 'error' && res.status === 402 && !onlyAnswers) {
                          disableAnswers();
                          triggerSearch.next();
                        }
                      }),
                      filter((res) => res.type !== 'error'),
                      map((res) => res as Chat.Answer),
                      map((res) => ({
                        results: res.sources,
                        append: false,
                        onlyAnswers,
                        loadingMore: false,
                        options: currentOptions,
                      })),
                      // Chat is emitting several times until the answer is complete, but the result sources doesn't change while answer is incomplete
                      // So we make sure to emit only when results are changing, preventing to write in the state several times while loading the answer
                      distinctUntilChanged(
                        (previous, current) => JSON.stringify(previous.results) === JSON.stringify(current.results),
                      ),
                    );
                  } else {
                    return search(query, currentOptions).pipe(
                      map((results) => ({
                        results,
                        append: !!trigger?.more,
                        onlyAnswers,
                        loadingMore: trigger?.more,
                        options: currentOptions,
                      })),
                    );
                  }
                }),
              ),
            ),
          ),
        ),
      )
      .subscribe(({ results, append, onlyAnswers, loadingMore, options }) => {
        if (results && results.total === 0 && options.autofilter && (results.autofilters || []).length > 0) {
          // If autofilter is enabled and no results are found, retry without autofilters
          autofilerDisabled.set(true);
          triggerSearch.next(loadingMore ? { more: true } : undefined);
        } else if (results) {
          if (isAnswerEnabled && !loadingMore) {
            if (!onlyAnswers) {
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
