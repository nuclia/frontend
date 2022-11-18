import { getLabelSets, predict, suggest } from '../api';
import { labelSets } from './labels.store';
import { suggestions, typeAhead } from './suggestions.store';
import { debounceTime, distinctUntilChanged, filter, forkJoin, map, merge, Observable, of, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { NO_RESULTS } from '../models';
import { searchWidget } from './widget.store';
import type { Classification, Search } from '@nuclia/core';

const subscriptions: Subscription[] = [];

export function unsubscribeAllEffects() {
  subscriptions.forEach((subscription) => subscription.unsubscribe());
}

/**
 * Initialise label sets in the store
 */
export function activateEditLabelsFeature() {
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
        const requests: [Observable<Search.Suggestions>, Observable<Classification[]>] = searchWidget.getValue()
          ?.features.suggestLabels
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
