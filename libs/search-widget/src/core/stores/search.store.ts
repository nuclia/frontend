import { SvelteState } from '../state-lib';
import type { IResource, Search, SearchOptions } from '@nuclia/core';
import { Classification, getFilterFromLabel } from '@nuclia/core';
import { DisplayedResource, NO_RESULTS, PENDING_RESULTS } from '../models';
import { Subject } from 'rxjs';

interface SearchState {
  query: string;
  filters: string[];
  options: SearchOptions;
  results: Search.Results | typeof PENDING_RESULTS;
  hasError: boolean;
  displayedResource: DisplayedResource | null;
}

export const searchState = new SvelteState<SearchState>({
  query: '',
  filters: [],
  options: { inTitleOnly: false, highlight: true },
  results: NO_RESULTS,
  hasError: false,
  displayedResource: null,
});

export const searchQuery = searchState.writer<string>(
  (state) => state.query,
  (state, query) => {
    const trimmedQuery = query.trim();
    if (!!trimmedQuery && trimmedQuery !== state.query) {
      return {
        ...state,
        query: trimmedQuery,
        hasError: false,
      };
    }
    return state;
  },
);

export const searchResults = searchState.writer<Search.Results | typeof PENDING_RESULTS>(
  (state) => state.results,
  (state, results) => ({
    ...state,
    results,
  }),
);

export const hasSearchError = searchState.writer<boolean>(
  (state) => state.hasError,
  (state, hasError) => ({
    ...state,
    hasError,
  }),
);

export const searchOptions = searchState.writer<SearchOptions>(
  (state) => state.options,
  (state, options) => ({
    ...state,
    options,
  }),
);

export const searchFilters = searchState.writer<string[]>(
  (state) => state.filters,
  (state, filters) => ({ ...state, filters }),
);

export const displayedResource = searchState.writer<DisplayedResource | null>(
  (state) => state.displayedResource,
  (state, displayedResource) => ({
    ...state,
    displayedResource,
  }),
);

export const isEmptySearchQuery = searchState.reader<boolean>((state) => !state.query && state.filters.length === 0);

export const pendingResults = searchState.reader<boolean>((state) => (state.results as typeof PENDING_RESULTS).pending);

export const smartResults = searchState.reader<Search.SmartResult[]>((state) => {
  if (!state.results.resources) {
    return [];
  }
  const allResources = state.results.resources;
  if (!allResources || Object.keys(allResources).length === 0) {
    return [] as Search.SmartResult[];
  }
  const fullTextResults =
    state.results.fulltext?.results.map((res) => allResources[res.rid]).filter((res) => !!res) || [];
  const semanticResults = state.results.sentences?.results || [];
  let smartResults: Search.SmartResult[] = [];

  // best fulltext match goes first
  if (fullTextResults.length > 0) {
    smartResults.push(fullTextResults[0]);
  }

  // if not a keyword search, add the 2 best semantic sentences
  const looksLikeKeywordSearch = state.query.split(' ').length < 3;
  if (!looksLikeKeywordSearch) {
    const twoBestSemantic = semanticResults.slice(0, 2);
    twoBestSemantic.forEach((sentence) => {
      const resource = allResources[sentence.rid];
      if (resource) {
        smartResults = addParagraphToSmartResults(
          smartResults,
          resource,
          generateFakeParagraphForSentence(allResources, sentence),
        );
      }
    });
  }

  // add the rest of the fulltext results
  if (fullTextResults.length > 0) {
    const existingResourceIds = smartResults.map((res) => res.id);
    const remainingFullTextResults = fullTextResults.slice(1).filter((res) => !existingResourceIds.includes(res.id));
    smartResults = [...smartResults, ...remainingFullTextResults];
  }

  // put the paragraphs in each resource
  state.results.paragraphs?.results?.forEach((paragraph) => {
    const resource = allResources[paragraph.rid];
    if (resource) {
      smartResults = addParagraphToSmartResults(smartResults, resource, paragraph);
    }
  });

  // for resources without paragraphs, create a fake one using summary if it exists (else, remove the resource)
  smartResults = smartResults
    .map((resource) => {
      if (resource.paragraphs && resource.paragraphs.length > 0) {
        return resource;
      } else {
        const summaryParagraph = generateFakeParagraphForSummary(resource);
        if (summaryParagraph) {
          return { ...resource, paragraphs: [summaryParagraph] };
        } else {
          return undefined;
        }
      }
    })
    .filter((r) => !!r) as Search.SmartResult[];

  return smartResults;
});

export const triggerSearch = new Subject<void>();

export const addLabelFilter = (label: Classification) => {
  const filter = getFilterFromLabel(label);
  const currentFilters = searchFilters.getValue();
  if (!currentFilters.includes(filter)) {
    searchFilters.set(currentFilters.concat([filter]));
  }
};

export const removeLabelFilter = (label: Classification) => {
  const filter = getFilterFromLabel(label);
  const currentFilters = searchFilters.getValue();
  searchFilters.set(currentFilters.filter((f) => f !== filter));
};

const marksRE = /(<mark>|<\/mark>)/g;
function addParagraphToSmartResults(
  smartResults: Search.SmartResult[],
  resource: Search.SmartResult,
  paragraph: Search.Paragraph | undefined,
): Search.SmartResult[] {
  if (!paragraph) {
    return smartResults;
  }
  const existingResource = smartResults.find((r) => r.id === resource.id);
  if (existingResource) {
    const existingParagraph = existingResource.paragraphs?.find(
      (p) => p.text.replace(marksRE, '') === paragraph.text.replace(marksRE, ''),
    );
    if (!existingParagraph) {
      existingResource.paragraphs = existingResource.paragraphs || [];
      existingResource.paragraphs.push(paragraph);
    }
  } else {
    smartResults.push({ ...resource, paragraphs: [paragraph] });
  }
  return smartResults;
}

function generateFakeParagraphForSentence(
  resources: { [id: string]: IResource },
  sentence: Search.Sentence | undefined,
): Search.SmartParagraph | undefined {
  if (!sentence) {
    return undefined;
  }
  const resource = resources[sentence.rid];
  return resource
    ? {
        score: 0,
        rid: resource.id,
        field_type: sentence.field_type,
        field: sentence.field,
        text: sentence.text,
        labels: [],
        sentences: [sentence],
      }
    : undefined;
}

function generateFakeParagraphForSummary(resource: IResource): Search.SmartParagraph | undefined {
  return resource.summary
    ? {
        score: 0,
        rid: resource.id,
        field_type: 'a',
        field: '',
        text: resource.summary,
        labels: [],
      }
    : undefined;
}
