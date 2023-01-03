import { SvelteState } from '../state-lib';
import type { WidgetParagraph } from '../models';
import { SearchOrder } from '../models';

interface ViewerSearchState {
  // search in viewer
  query: string;
  results: WidgetParagraph[] | null;
  hasError: boolean;
  order: SearchOrder;
}

export const viewerSearchState = new SvelteState<ViewerSearchState>({
  query: '',
  results: null,
  hasError: false,
  order: SearchOrder.SEQUENTIAL,
});

export const viewerSearchQuery = viewerSearchState.writer<string>(
  (state) => state.query,
  (state, query) => {
    const trimmedQuery = query.trim();
    if (trimmedQuery !== state.query) {
      return {
        ...state,
        query: trimmedQuery,
        hasError: false,
      };
    }
    return state;
  },
);

export const hasViewerSearchError = viewerSearchState.writer<boolean>(
  (state) => state.hasError,
  (state, hasError) => ({
    ...state,
    hasError,
  }),
);

export const viewerSearchOrder = viewerSearchState.writer<SearchOrder>(
  (state) => state.order,
  (state, order) => ({
    ...state,
    order,
  }),
);

export const viewerSearchResults = viewerSearchState.writer<WidgetParagraph[] | null>(
  (state) => state.results,
  (state, results) => ({
    ...state,
    results: results ? sortParagraphs(results, state.order) : null,
  }),
);

function sortParagraphs(paragraphs: WidgetParagraph[], order: SearchOrder) {
  if (order === SearchOrder.SEQUENTIAL) {
    return paragraphs.slice().sort((a, b) => {
      const aIsNumber = typeof a.paragraph.start === 'number';
      const bIsNumber = typeof b.paragraph.start === 'number';
      if (!aIsNumber && !bIsNumber) {
        return 0;
      } else if (aIsNumber && !bIsNumber) {
        return 1;
      } else if (!aIsNumber && bIsNumber) {
        return -1;
      } else {
        return a.paragraph.start! - b.paragraph.start!;
      }
    });
  }
  return paragraphs;
}
