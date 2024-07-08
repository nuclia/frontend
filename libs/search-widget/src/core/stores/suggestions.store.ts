import { SvelteState } from '../state-lib';
import type { Classification, IErrorResponse, Search } from '@nuclia/core';
import { NO_SUGGESTION_RESULTS } from '../models';
import { combineLatest, map, Observable, Subject } from 'rxjs';

const MAX_ENTITIES = 4;

export type Suggestions = {
  results: Search.Suggestions;
  labels?: Classification[];
};

interface SuggestionState {
  typeAhead: string;
  suggestions: Suggestions;
  error?: IErrorResponse;
  selectedEntity?: number;
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
    selectedEntity: undefined,
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

export const suggestedEntities = suggestionState.reader<{ family: string; value: string }[]>((state) =>
  (state.suggestions.results.entities?.entities || []).slice(0, MAX_ENTITIES),
);

export const hasSuggestions: Observable<boolean> = combineLatest([
  suggestedParagraphs,
  suggestedLabels,
  suggestedEntities,
]).pipe(
  map(
    ([suggestedParagraphs, suggestedLabels, suggestedEntities]) =>
      suggestedParagraphs.length > 0 || suggestedLabels.length > 0 || suggestedEntities.length > 0,
  ),
);

export const selectedEntity = suggestionState.reader<{ family: string; value: string } | undefined>((state) =>
  typeof state.selectedEntity === 'number'
    ? state.suggestions.results.entities?.entities?.[state.selectedEntity]
    : undefined,
);

export const selectNextEntity = suggestionState.action((state) => {
  const entities = suggestedEntities.getValue();
  const selectedEntity = typeof state.selectedEntity === 'number' ? (state.selectedEntity + 1) % entities.length : 0;
  return { ...state, selectedEntity };
});

export const selectPrevEntity = suggestionState.action((state) => {
  const entities = suggestedEntities.getValue();
  let selectedEntity = typeof state.selectedEntity === 'number' ? state.selectedEntity - 1 : 0;
  if (selectedEntity < 0) selectedEntity = entities.length - 1;
  return { ...state, selectedEntity };
});

export const autocomplete = (suggestion: string) => {
  let query = typeAhead.getValue();
  const words = query.split(/\s+/).filter((word) => word);
  const index = query.lastIndexOf(words[words.length - 1]);
  query = query.substring(0, index) + suggestion;
  typeAhead.set(query);
  suggestions.set({ results: NO_SUGGESTION_RESULTS });
};
