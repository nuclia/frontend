import { writableSubject } from './svelte-writable-subject';
import type { Classification, Search } from '@nuclia/core';
import type { Intents } from '../models';
import { NO_RESULTS } from '../models';
import { combineLatest, distinctUntilChanged, filter, forkJoin, map, merge, Observable, of } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { suggest } from '../api';
import { predict } from '../tensor';

export type Suggestions = {
  results: Search.Results;
  intents: Intents;
};

export const typeAhead = writableSubject('');
export const suggestionEnabled = writableSubject(false);
export const suggestionsHasError = writableSubject(false);

export const suggestions: Observable<Suggestions> = suggestionEnabled.pipe(
  filter((enabled) => enabled),
  switchMap(() =>
    merge(
      // Trigger suggestion when hitting space between words
      typeAhead.pipe(filter((query) => query.slice(-1) === ' ' && query.slice(-2, -1) !== ' ')),
      // Trigger suggestion after 350ms of inactivity
      typeAhead.pipe(debounceTime(350)),
    ),
  ),
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
);

export const suggestedParagraphs: Observable<Search.Paragraph[]> = suggestions.pipe(
  map((suggestions) => suggestions.results.paragraphs?.results || []),
);

export const suggestedIntents: Observable<Classification[]> = suggestions.pipe(
  map((suggestions) => suggestions.intents.labels || []),
);

export const hasSuggestions: Observable<boolean> = combineLatest([suggestedParagraphs, suggestedIntents]).pipe(
  map(([suggestedParagraphs, suggestedIntents]) => suggestedParagraphs.length > 0 || suggestedIntents.length > 0),
);

export function enableSuggestion() {
  suggestionEnabled.set(true);
}
