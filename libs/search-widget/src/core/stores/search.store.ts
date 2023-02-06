import { SvelteState } from '../state-lib';
import type { IResource, Search, SearchOptions } from '@nuclia/core';
import { Classification, getFilterFromLabel, SHORT_FIELD_TYPE, shortToLongFieldType } from '@nuclia/core';
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
  const fullTextResults: IResource[] =
    state.results.fulltext?.results.map((res) => allResources[res.rid]).filter((res) => !!res) || [];
  const semanticResults = (state.results.sentences?.results || []).reduce((acc, sentence) => {
    if (!acc.find((s) => s.text === sentence.text)) {
      acc.push(sentence);
    }
    return acc;
  }, [] as Search.Sentence[]);
  let smartResults: Search.SmartResult[] = [];

  // best fulltext match goes first
  if (fullTextResults.length > 0) {
    smartResults.push(fullTextResults[0]);
  }

  // if not a keyword search, add the 2 best semantic sentences
  const looksLikeKeywordSearch = state.query.split(' ').length < 3;
  if (!looksLikeKeywordSearch) {
    const fourBestSemantic = semanticResults.slice(0, 4);
    fourBestSemantic.forEach((sentence) => {
      const resource = allResources[sentence.rid];
      const containingParagraph = state.results.paragraphs?.results?.find(
        (p) =>
          p.rid === sentence.rid &&
          p.position &&
          sentence.position &&
          p.position.start <= sentence.position.start &&
          p.position.end >= sentence.position.end,
      );
      if (containingParagraph && sentence.position) {
        sentence.position.page_number = containingParagraph.position?.page_number;
      }
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

export const entityRelations = searchState.reader((state) =>
  Object.entries(state.results.relations?.entities || {})
    .map(([entity, relations]) => ({
      entity,
      relations: relations.related_to
        .filter((relation) => relation.entity_type === 'entity' && relation.relation_label.length > 0)
        .reduce((acc, current) => {
          if (!acc[current.relation_label]) {
            acc[current.relation_label] = [current.entity];
          } else {
            acc[current.relation_label].push(current.entity);
          }
          return acc;
        }, {} as { [relation: string]: string[] }),
    }))
    .filter((entity) => Object.keys(entity.relations).length > 0),
);

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
export function addParagraphToSmartResults(
  smartResults: Search.SmartResult[],
  resource: Search.SmartResult,
  paragraph: Search.Paragraph | undefined,
): Search.SmartResult[] {
  if (!paragraph) {
    return smartResults;
  }
  const longFieldType = shortToLongFieldType(paragraph.field_type);
  if (!longFieldType) {
    return smartResults;
  }
  const existingResource = smartResults.find(
    (r) => r.id === resource.id && r.field?.field_id === paragraph.field && r.field.field_type === longFieldType,
  );
  if (existingResource) {
    const existingParagraph = existingResource.paragraphs?.find(
      (p) => p.text.replace(marksRE, '').trim() === paragraph.text.replace(marksRE, '').trim(),
    );
    if (!existingParagraph) {
      existingResource.paragraphs = existingResource.paragraphs || [];
      existingResource.paragraphs.push(paragraph);
    }
  } else {
    smartResults.push({
      ...resource,
      paragraphs: [paragraph],
      field: { field_id: paragraph.field, field_type: longFieldType },
    });
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
        position:
          sentence.position && (sentence.position.page_number || sentence.position.page_number === 0)
            ? { ...sentence.position, page_number: sentence.position.page_number as number }
            : undefined,
      }
    : undefined;
}

function generateFakeParagraphForSummary(resource: IResource): Search.SmartParagraph | undefined {
  return resource.summary
    ? {
        score: 0,
        rid: resource.id,
        field_type: SHORT_FIELD_TYPE.generic,
        field: '',
        text: resource.summary,
        labels: [],
      }
    : undefined;
}
