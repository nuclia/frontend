import { getLabelSets, suggest } from '../api';
import { labelSets } from './labels.store';
import { suggestions, typeAhead } from './suggestions.store';
import { debounceTime, distinctUntilChanged, filter, forkJoin, map, merge, of, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { NO_RESULTS } from '../models';
import { predict } from '../tensor';

/**
 * Initialise label sets in the store
 */
export function activateEditLabelsFeature() {
  getLabelSets().subscribe((labelSetMap) => labelSets.set(labelSetMap));
}

/**
 * Subscribe to type ahead, call suggest and predict with the query and set suggestions in the state accordingly.
 * Returns a Subscription: don't forget to unsubscribe from it on destroy.
 */
export function activateTypeAheadSuggestions(): Subscription {
  return merge(
    // Trigger suggestion when hitting space between words
    typeAhead.pipe(filter((query) => query.slice(-1) === ' ' && query.slice(-2, -1) !== ' ')),
    // Trigger suggestion after 350ms of inactivity
    typeAhead.pipe(debounceTime(350)),
  )
    .pipe(
      // Don't trigger suggestion after inactivity if only spaces were added at the end of the query
      distinctUntilChanged((previous, current) => previous.trim() === current.trim()),
      switchMap((query) => {
        if (!query || !query.trim() || query.trim().length <= 2) {
          return of({
            results: NO_RESULTS,
            intents: {},
          });
        }
        return forkJoin([suggest(query), predict(query)]).pipe(
          map(([results, predictions]) => ({
            results,
            intents: { labels: predictions },
          })),
        );
      }),
    )
    .subscribe((suggestionList) => suggestions.set(suggestionList));
}
