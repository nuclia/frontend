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
  results: Search.FindResults;
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

export const searchResults = searchState.writer<Search.FindResults, { results: Search.FindResults; append: boolean }>(
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

export const hasMore = searchState.reader<boolean>((state) => state.results.next_page);
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

export const smartResults = searchState.reader<Search.SmartResult[]>((state) => {
  if (!state.results.resources) {
    return [];
  }
  return getSortedResults(state.results.resources);
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

function appendResults(existingResults: Search.FindResults, newResults: Search.FindResults): Search.FindResults {
  if (!existingResults) {
    return newResults;
  }
  if (!newResults) {
    return existingResults;
  }
  return {
    ...existingResults,
    ...newResults,
    resources: deepMergeResources(existingResults.resources || {}, newResults.resources || {}),
  };
}

function deepMergeResources(
  existing: { [id: string]: Search.FindResource },
  newEntries: { [id: string]: Search.FindResource },
): { [id: string]: Search.FindResource } {
  return Object.entries(newEntries).reduce((acc, [id, obj]) => {
    acc[id] = !acc[id] ? obj : { ...acc[id], ...obj, fields: deepMergeFields(acc[id].fields, obj.fields) };
    return acc;
  }, existing);
}

function deepMergeFields(
  existing: { [id: string]: Search.FindField },
  newEntries: { [id: string]: Search.FindField },
): { [id: string]: Search.FindField } {
  return Object.entries(newEntries).reduce((acc, [id, obj]) => {
    acc[id] = !acc[id] ? obj : { ...acc[id], ...obj, paragraphs: { ...acc[id].paragraphs, ...obj.paragraphs } };
    return acc;
  }, existing);
}

export function getSortedResults(resources: { [id: string]: Search.FindResource } | undefined): Search.SmartResult[] {
  if (!resources) {
    return [];
  }
  return Object.values(resources)
    .map((res) => ({
      ...res,
      paragraphs: Object.values(res.fields)
        .reduce((acc, curr) => acc.concat(Object.values(curr.paragraphs)), [] as Search.FindParagraph[])
        .sort((a, b) => a.order - b.order),
    }))
    .map((res: Search.SmartResult) => {
      // take the first paragraph which is not from a generic field
      const firstFieldParagraph = res.paragraphs?.find(
        (paragraph) => paragraph.id.split('/')[1] !== SHORT_FIELD_TYPE.generic,
      );
      if (firstFieldParagraph) {
        const [, fieldType, fieldId] = firstFieldParagraph.id.split('/');
        const field_type = shortToLongFieldType(fieldType as SHORT_FIELD_TYPE);
        if (field_type && fieldId) {
          res.field = { field_type, field_id: fieldId };
        }
      } else {
        // if none, guess the main field
        res.field = getMainFieldFromResource(res);
      }
      if (res.field) {
        const dataKey = getDataKeyFromFieldType(res.field.field_type);
        res.fieldData = dataKey ? res.data?.[dataKey]?.[res.field.field_id] : undefined;
      }
      return res;
    })
    .sort((a, b) => (a.paragraphs?.[0]?.order || 0) - (b.paragraphs?.[0]?.order || 0));
}

function getMainFieldFromResource(resource: IResource): FieldId | undefined {
  if (!resource.data) {
    return;
  }
  // try to find a file field matching the resource icon
  // if none, we just take the first field
  const mainFileField = resource.data?.files
    ? Object.entries(resource.data.files).find(([, field]) => field.value?.file?.content_type === resource.icon)
    : undefined;
  if (mainFileField) {
    return { field_type: FIELD_TYPE.file, field_id: mainFileField[0] };
  } else if (resource.data.files) {
    return { field_id: Object.keys(resource.data.files)[0], field_type: FIELD_TYPE.file };
  } else if (resource.data.links) {
    return { field_id: Object.keys(resource.data.links)[0], field_type: FIELD_TYPE.link };
  } else if (resource.data.texts) {
    return { field_id: Object.keys(resource.data.texts)[0], field_type: FIELD_TYPE.text };
  } else {
    return;
  }
}
