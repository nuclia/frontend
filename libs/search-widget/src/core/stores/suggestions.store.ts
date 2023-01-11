import { SvelteState } from '../state-lib';
import type { Classification, Search } from '@nuclia/core';
import { FieldType, NO_RESULTS } from '../models';
import { combineLatest, map, Observable, Subject } from 'rxjs';

export type Suggestions = {
  results: Search.Results;
  labels?: Classification[];
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
  },
  hasError: false,
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

export const suggestedParagraphs: Observable<Search.Paragraph[]> = suggestionState.reader<Search.Paragraph[]>((state) =>
  (state.suggestions.results.paragraphs?.results || []).filter(
    (paragraph) => paragraph.field_type === FieldType.GENERIC,
  ),
);

export const suggestedLabels: Observable<Classification[]> = suggestionState.reader<Classification[]>(
  (state) => state.suggestions.labels || [],
);

export const hasSuggestions: Observable<boolean> = combineLatest([suggestedParagraphs, suggestedLabels]).pipe(
  map(([suggestedParagraphs, suggestedLabels]) => suggestedParagraphs.length > 0 || suggestedLabels.length > 0),
);
