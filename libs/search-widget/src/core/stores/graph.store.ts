import { SvelteState } from '../state-lib';
import type { NerLinkHydrated, NerNode } from '../knowledge-graph.models';

interface GraphState {
  query: string;
  selectedNode?: NerNode;
  selectedNodeEdges?: NerLinkHydrated[];
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

export const graphSelection = graphState.writer<NerNode | undefined>(
  (state) => state.selectedNode,
  (state, selectedNode) => ({
    ...state,
    selectedNode,
    query: selectedNode?.ner || '',
  }),
);

export const graphSelectionRelations = graphState.writer<NerLinkHydrated[] | undefined>(
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
  }),
);
