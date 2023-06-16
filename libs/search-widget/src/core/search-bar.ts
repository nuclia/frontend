import { distinctUntilChanged, filter, map, switchMap, take, tap } from 'rxjs/operators';
import { search } from './api';
import type { Search, SearchOptions } from '@nuclia/core';
import { Chat, ResourceProperties } from '@nuclia/core';
import { forkJoin, Subscription } from 'rxjs';
import {
  isEmptySearchQuery,
  labelFilters,
  loadMore,
  pageNumber,
  pendingResults,
  searchFilters,
  searchOptions,
  searchQuery,
  searchResults,
  triggerSearch,
} from './stores/search.store';
import { isTitleOnly } from '../common/label/label.utils';
import { askQuestion } from './stores/effects';
import { onlyAnswers } from './stores/widget.store';

const subscriptions: Subscription[] = [];

export function unsubscribeTriggerSearch() {
  subscriptions.forEach((subscription) => subscription.unsubscribe());
}

export const setupTriggerSearch = (
  dispatch: (event: string, details: string | Search.Results | Search.FindResults) => void | undefined,
  isAnswerEnabled = false,
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
            tap(() => (!trigger?.more ? pageNumber.set(0) : undefined)),
            switchMap((query) =>
              forkJoin([
                onlyAnswers.pipe(take(1)),
                searchOptions.pipe(take(1)),
                searchFilters.pipe(take(1)),
                labelFilters.pipe(take(1)),
              ]).pipe(
                tap(([onlyAnswers]) => {
                  if (!onlyAnswers) {
                    pendingResults.set(true);
                  }
                }),
                switchMap(([onlyAnswers, options, filters, labelFilters]) => {
                  if (isAnswerEnabled && !trigger?.more) {
                    return askQuestion(query, true).pipe(
                      map((res) => ({ ...res, onlyAnswers, loadingMore: trigger?.more })),
                    );
                  } else {
                    const show = [ResourceProperties.BASIC, ResourceProperties.VALUES, ResourceProperties.ORIGIN];
                    const currentOptions: SearchOptions = {
                      ...options,
                      show,
                      filters,
                      inTitleOnly: isTitleOnly(query, labelFilters),
                    };
                    return search(query, currentOptions).pipe(
                      map((results) => ({results, append: !!trigger?.more, onlyAnswers, loadingMore: trigger?.more})),
                    );
                  }
                }),
              ),
            ),
          ),
        ),
      )
      .subscribe((data) => {
        if (isAnswerEnabled && !data.loadingMore) {
          const { answer } = data as { question: string; answer: Chat.Answer };
          if (answer.sources && !data.onlyAnswers) {
            searchResults.set({ results: answer.sources, append: false });
          }
        } else {
          const {results, append} = data as {results: Search.FindResults, append: boolean};
          searchResults.set({results, append})
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
        triggerSearch.next({more: true});
      }),
  );
};
