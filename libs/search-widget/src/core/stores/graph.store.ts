import type { Search } from '@nuclia/core';
import type { NerLink, NerNode } from '../knowledge-graph.models';
import { SvelteState } from '../state-lib';

interface GraphState {
  query: string;
  selectedNode?: NerNode | null;
  selectedNodeEdges?: NerLink[];
  selectedNodeResults?: Search.FindParagraph[];
}

export const graphState = new SvelteState<GraphState>({
  query: '',
});

export const graphQuery = graphState.writer<string>(
  (state) => state.query,
  (state, query) => ({
    ...state,
    query,
  }),
);

export const graphSelection = graphState.writer<NerNode | undefined | null>(
  (state) => state.selectedNode,
  (state, selectedNode) => ({
    ...state,
    selectedNode,
    query: selectedNode?.ner || '',
  }),
);

export const graphSelectionRelations = graphState.writer<NerLink[] | undefined>(
  (state) =>
    (state.selectedNodeEdges || []).sort((a, b) => {
      if (a.relevance < b.relevance) {
        return 1;
      } else if (a.relevance > b.relevance) {
        return -1;
      } else {
        return 0;
      }
    }),
  (state, selectedNodeEdges) => ({
    ...state,
    selectedNodeEdges,
    selectedNodeResults: undefined,
  }),
);

export const graphSearchResults = graphState.writer<Search.FindParagraph[] | undefined>(
  (state) => state.selectedNodeResults,
  (state, results) => ({
    ...state,
    selectedNodeResults: results,
  }),
);

export const graphSelectionParagraphs = graphState.reader<Search.FindParagraph[]>(
  (state) => state.selectedNodeResults || [],
);
