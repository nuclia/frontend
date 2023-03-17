import { SvelteState } from '../state-lib';
import type { FieldId, IResource, ResourceField, Search, SearchOptions } from '@nuclia/core';
import {
  Classification,
  FIELD_TYPE,
  getDataKeyFromFieldType,
  getFilterFromLabel,
  SHORT_FIELD_TYPE,
  shortToLongFieldType,
} from '@nuclia/core';
import { DisplayedResource, NO_RESULTS } from '../models';
import { Subject } from 'rxjs';

// TODO: once old widget will be removed, we should remove displayedResource from the store
interface SearchState {
  query: string;
  filters: string[];
  options: SearchOptions;
  results: Search.Results;
  hasError: boolean;
  displayedResource: DisplayedResource | null;
  pending: boolean;
}

export const searchState = new SvelteState<SearchState>({
  query: '',
  filters: [],
  options: { inTitleOnly: false, highlight: true, page_number: 0 },
  results: NO_RESULTS,
  hasError: false,
  displayedResource: null,
  pending: false,
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

export const searchResults = searchState.writer<Search.Results, { results: Search.Results; append: boolean }>(
  (state) => state.results,
  (state, params) => ({
    ...state,
    results: params.append ? appendResults(state.results, params.results) : params.results,
    pending: false,
  }),
);

export const hasSearchError = searchState.writer<boolean>(
  (state) => state.hasError,
  (state, hasError) => ({
    ...state,
    hasError,
    pending: false,
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

export const hasMore = searchState.reader<boolean>((state) => !!state.results.fulltext?.next_page);
export const loadMore = searchState.writer<number, void>(
  (state) => state.options.page_number || 0,
  (state) => ({
    ...state,
    options: { ...state.options, page_number: (state.options.page_number || 0) + 1 },
  }),
);

export const pendingResults = searchState.writer<boolean>(
  (state) => state.pending,
  (state, pending) => ({ ...state, pending }),
);

const LATIN_CHAR = new RegExp(/[a-zA-Z0-9\s]+/);
export const smartResults = searchState.reader<Search.SmartResult[]>((state) => {
  if (!state.results.resources) {
    return [];
  }
  const allResources = state.results.resources;
  if (!allResources || Object.keys(allResources).length === 0) {
    return [] as Search.SmartResult[];
  }
  const fullTextResults: IResource[] = (state.results.fulltext?.results || []).reduce((acc, curr) => {
    if (!acc.find((res) => res.id === curr.rid)) {
      acc.push(allResources[curr.rid]);
    }
    return acc;
  }, [] as IResource[]);
  const semanticResults = state.results.sentences?.results || [];
  let smartResults: Search.SmartResult[] = [];

  // best fulltext match goes first
  if (fullTextResults.length > 0) {
    smartResults.push(fullTextResults[0]);
  }

  // check if less than 3 words in the query
  // unless there are some non-latin characters (because in Chinese for example there is no space between words)
  const nonLatinChars = state.query.trim().replace(LATIN_CHAR, '');
  const looksLikeKeywordSearch = state.query.split(' ').length < 3 && nonLatinChars.length < 2;
  // if not a keyword search, add the 2 best semantic sentences
  if (!looksLikeKeywordSearch) {
    const twoBestSemantic = semanticResults.slice(0, 2);
    twoBestSemantic.forEach((sentence) => {
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
  if (fullTextResults.length > 1) {
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

  // for resources without paragraphs, create a fake one using summary or title if they exist (else, remove the resource)
  smartResults = smartResults
    .map((resource) => {
      if (resource.paragraphs && resource.paragraphs.length > 0) {
        return resource;
      } else {
        const field = getFirstFieldIdFromResource(resource);
        const fakeParagraph = generateFakeParagraphForSummaryOrTitle(resource, state.results.paragraphs?.results || []);
        if (fakeParagraph) {
          return { ...resource, field, paragraphs: [fakeParagraph] };
        } else {
          return undefined;
        }
      }
    })
    .filter((r) => !!r) as Search.SmartResult[];

  // set fieldData for each resource
  smartResults = smartResults.map((resource) => {
    const field = resource.field ? resource.field : getFirstFieldIdFromResource(resource);
    if (field) {
      const dataKey = getDataKeyFromFieldType(field.field_type);
      const fieldData = dataKey ? resource.data?.[dataKey]?.[field.field_id] : undefined;
      return { ...resource, field, fieldData };
    } else {
      return resource;
    }
  });

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

export const triggerSearch: Subject<{ more: true } | void> = new Subject<{ more: true } | void>();

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
  const existingResource = smartResults.find((result) => {
    if (result.id !== resource.id) {
      return false;
    }
    const undefinedField = !result.field?.field_id && !result.field?.field_type;
    const sameField = result.field?.field_id === paragraph.field && result.field.field_type === longFieldType;
    return undefinedField || sameField;
  });

  const field = { field_id: paragraph.field, field_type: longFieldType };
  if (existingResource) {
    existingResource.field = field;
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
      field,
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

function generateFakeParagraphForSummaryOrTitle(
  resource: IResource,
  paragraphs: Search.Paragraph[],
): Search.SmartParagraph | undefined {
  const title = paragraphs.find(
    (paragraph) => paragraph.rid === resource.id && paragraph.field_type === SHORT_FIELD_TYPE.generic,
  )?.text;
  const text = resource.summary || title;
  return text
    ? {
        score: 0,
        rid: resource.id,
        field_type: SHORT_FIELD_TYPE.generic,
        field: '',
        text: text,
        labels: [],
      }
    : undefined;
}

function getFirstFieldIdFromResource(resource: IResource): FieldId | undefined {
  if (!resource.data) {
    return;
  }
  if (resource.data.files) {
    return { field_id: Object.keys(resource.data.files)[0], field_type: FIELD_TYPE.file };
  } else if (resource.data.links) {
    return { field_id: Object.keys(resource.data.links)[0], field_type: FIELD_TYPE.link };
  } else if (resource.data.texts) {
    return { field_id: Object.keys(resource.data.texts)[0], field_type: FIELD_TYPE.text };
  } else {
    return;
  }
}

export function getFirstResourceField(resource: IResource): ResourceField | undefined {
  if (!resource.data) {
    return;
  }
  if (resource.data.files) {
    const fieldId = Object.keys(resource.data.files)[0];
    return { field_id: fieldId, field_type: FIELD_TYPE.file, ...resource.data.files[fieldId] };
  } else if (resource.data.links) {
    const fieldId = Object.keys(resource.data.links)[0];
    return { field_id: fieldId, field_type: FIELD_TYPE.link, ...resource.data.links[fieldId] };
  } else if (resource.data.texts) {
    const fieldId = Object.keys(resource.data.texts)[0];
    return { field_id: fieldId, field_type: FIELD_TYPE.text, ...resource.data.texts[fieldId] };
  } else {
    return;
  }
}

function appendResults(existingResults: Search.Results, newResults: Search.Results): Search.Results {
  if (!existingResults) {
    return newResults;
  }
  if (!newResults) {
    return existingResults;
  }
  const results = {
    ...existingResults,
    resources: { ...existingResults.resources, ...newResults.resources },
  };
  if (!existingResults.paragraphs) {
    results.paragraphs = newResults.paragraphs;
  } else {
    results.paragraphs = {
      ...existingResults.paragraphs,
      results: (existingResults.paragraphs?.results || []).concat(newResults.paragraphs?.results || []),
    };
  }
  if (!existingResults.sentences) {
    results.sentences = newResults.sentences;
  } else {
    results.sentences = {
      ...existingResults.sentences,
      results: (existingResults.sentences?.results || []).concat(newResults.sentences?.results || []),
    };
  }
  if (!existingResults.fulltext) {
    results.fulltext = newResults.fulltext;
  } else {
    results.fulltext = {
      ...existingResults.fulltext,
      results: (existingResults.fulltext?.results || []).concat(newResults.fulltext?.results || []),
    };
  }
  return results;
}
