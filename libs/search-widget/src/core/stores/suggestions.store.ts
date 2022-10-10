import { SvelteState } from '../state-lib';
import type { Classification, Search } from '@nuclia/core';
import type { Intents } from '../models';
import { NO_RESULTS } from '../models';
import { combineLatest, map, Observable } from 'rxjs';

export type Suggestions = {
  results: Search.Results;
  intents: Intents;
};

interface SuggestionState {
  typeAhead: string;
  suggestions: Suggestions;
  hasError: boolean;
}

export const suggestionState = new SvelteState<SuggestionState>({
  typeAhead: '',
  suggestions: {
    results: NO_RESULTS,
    intents: {},
  },
  hasError: false,
});

export const typeAhead = suggestionState.writer<string>(
  (state) => state.typeAhead,
  (state, query) => ({
    ...state,
    typeAhead: query,
  }),
);

export const suggestions = suggestionState.writer<Suggestions>(
  (state) => state.suggestions,
  (state, suggestions) => ({
    ...state,
    suggestions,
    hasError: false,
  }),
);

export const suggestionsHasError = suggestionState.writer<boolean>(
  (state) => state.hasError,
  (state, hasError) => ({
    ...state,
    hasError,
  }),
);

export const suggestedParagraphs: Observable<Search.Paragraph[]> = suggestionState.reader<Search.Paragraph[]>(
  (state) => state.suggestions.results.paragraphs?.results || [],
);

export const suggestedIntents: Observable<Classification[]> = suggestionState.reader<Classification[]>(
  (state) => state.suggestions.intents.labels || [],
);

export const hasSuggestions: Observable<boolean> = combineLatest([suggestedParagraphs, suggestedIntents]).pipe(
  map(([suggestedParagraphs, suggestedIntents]) => suggestedParagraphs.length > 0 || suggestedIntents.length > 0),
);
