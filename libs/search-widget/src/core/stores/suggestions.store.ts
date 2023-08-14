import { SvelteState } from '../state-lib';
import type { Classification, IErrorResponse, Search } from '@nuclia/core';
import { NO_SUGGESTION_RESULTS } from '../models';
import { combineLatest, map, Observable, Subject } from 'rxjs';
import { suggestEntities } from './widget.store';

export type Suggestions = {
  results: Search.Suggestions;
  labels?: Classification[];
};

interface SuggestionState {
  typeAhead: string;
  suggestions: Suggestions;
  error?: IErrorResponse;
}

export const suggestionState = new SvelteState<SuggestionState>({
  typeAhead: '',
  suggestions: {
    results: NO_SUGGESTION_RESULTS,
  },
});

export const triggerSuggestions = new Subject<void>();

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
    error: undefined,
  }),
);

export const suggestionError = suggestionState.writer<IErrorResponse | undefined>(
  (state) => state.error,
  (state, error) => ({
    ...state,
    error,
  }),
);
export const suggestionsHasError = suggestionState.reader<boolean>((state) => !!state.error);

export const suggestedParagraphs: Observable<Search.Paragraph[]> = suggestionState.reader<Search.Paragraph[]>(
  (state) => state.suggestions.results.paragraphs?.results || [],
);

export const suggestedLabels: Observable<Classification[]> = suggestionState.reader<Classification[]>(
  (state) => state.suggestions.labels || [],
);

export const suggestedEntities: Observable<string[]> = suggestionState.reader<string[]>(
  (state) => state.suggestions.results.entities?.entities || [],
);

export const hasSuggestions: Observable<boolean> = combineLatest([
  suggestedParagraphs,
  suggestedLabels,
  suggestedEntities,
  suggestEntities,
]).pipe(
  map(
    ([suggestedParagraphs, suggestedLabels, suggestedEntities, canSuggestEntities]) =>
      suggestedParagraphs.length > 0 ||
      suggestedLabels.length > 0 ||
      (suggestedEntities.length > 0 && canSuggestEntities), // TODO: canSuggestEntities can be deleted once "features" param works properly on suggest endpoint
  ),
);
