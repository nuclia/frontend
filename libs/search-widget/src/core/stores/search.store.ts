import { SvelteState } from '../state-lib';
import type { IResource, Paragraph, ResourceField, Search, SearchOptions } from '@nuclia/core';
import {
  Classification,
  FIELD_TYPE,
  FileFieldData,
  getDataKeyFromFieldType,
  getEntityFromFilter,
  getFilterFromEntity,
  getFilterFromLabel,
  getLabelFromFilter,
  IErrorResponse,
  LabelSetKind,
  LinkFieldData,
  SHORT_FIELD_TYPE,
  shortToLongFieldType,
} from '@nuclia/core';
import { DisplayedResource, FindResultsAsList, NO_RESULT_LIST, ResultType, TypedResult } from '../models';
import { combineLatest, filter, map, Subject } from 'rxjs';
import type { LabelFilter } from '../../common';

interface SearchFilters {
  labels?: LabelFilter[];
  entities?: EntityFilter[];
  autofilters?: EntityFilter[];
}

export interface EntityFilter {
  family: string;
  entity: string;
}

type EngagementType = 'CHAT' | 'RESULT';

interface Engagement {
  type?: EngagementType;
  resourceRank?: number;
  paragraphRank?: number;
  paragraphType?: Search.FindScoreType;
  paragraphOrder?: number;
}

// TODO: once old widget will be removed, we should remove displayedResource from the store
interface SearchState {
  query: string;
  filters: SearchFilters;
  options: SearchOptions;
  results: FindResultsAsList;
  error?: IErrorResponse;
  displayedResource: DisplayedResource | null;
  pending: boolean;
  autofilerDisabled?: boolean;
  showResults: boolean;
  tracking: {
    startTime: number;
    resultsReceived: boolean;
    searchId: string | undefined;
    engagement: Engagement;
  };
}

export const searchState = new SvelteState<SearchState>({
  query: '',
  filters: {},
  options: { inTitleOnly: false, highlight: true, page_number: 0 },
  results: NO_RESULT_LIST,
  displayedResource: null,
  pending: false,
  showResults: false,
  tracking: {
    startTime: 0,
    resultsReceived: false,
    searchId: undefined,
    engagement: {},
  },
});

export const searchQuery = searchState.writer<string>(
  (state) => state.query,
  (state, query) => {
    const trimmedQuery = query.trim();
    if (trimmedQuery !== state.query) {
      return {
        ...state,
        query: trimmedQuery,
        error: undefined,
        autofilerDisabled: false,
      };
    }
    return state;
  },
);

export const searchResults = searchState.writer<
  Search.FindResults,
  {
    results: Search.FindResults;
    append: boolean;
  }
>(
  (state) => state.results,
  (state, params) => {
    const sortedResults = getSortedResults(Object.values(params.results.resources || {}));
    const { resources, ...results } = params.results;
    return {
      ...state,
      results: {
        ...results,
        resultList: params.append ? state.results.resultList.concat(sortedResults) : sortedResults,
      },
      pending: false,
      showResults: true,
      filters: {
        ...state.filters,
        autofilters: params.append
          ? state.filters.autofilters
          : (params.results.autofilters || []).map((filter) => getEntityFromFilter(filter)),
      },
    };
  },
);

export const resultList = searchState.reader<Search.FieldResult[]>((state) => {
  return state.results.resultList;
});

export const showResults = searchState.writer<boolean>(
  (state) => state.showResults,
  (state, showResults) => ({
    ...state,
    showResults,
  }),
);

export const hasSearchError = searchState.reader<boolean>((state) => !!state.error);
export const hasPartialResults = searchState.reader<boolean>((state) => !!state.error && state.error.status === 206);
export const searchError = searchState.writer<IErrorResponse | undefined>(
  (state) => state.error,
  (state, error) => ({
    ...state,
    error,
    pending: false,
    showResults: true,
  }),
);

export const searchOptions = searchState.writer<SearchOptions>(
  (state) => state.options,
  (state, options) => ({
    ...state,
    options,
  }),
);

export const searchFilters = searchState.writer<string[], { filters: string[]; titleOnly: boolean }>(
  (state) => [
    ...(state.filters.labels || []).map((filter) => getFilterFromLabel(filter.classification)),
    ...(state.filters.entities || []).map((filter) => getFilterFromEntity(filter)),
  ],
  (state, data) => {
    const filters: SearchFilters = {};
    data.filters.forEach((filter) => {
      const spreadFilter = filter.split('/').filter((val) => !!val);
      if (spreadFilter[0] === 'l') {
        const labelFilter = {
          classification: getLabelFromFilter(filter),
          kind: data.titleOnly ? LabelSetKind.RESOURCES : LabelSetKind.PARAGRAPHS,
        };
        if (!filters.labels) {
          filters.labels = [labelFilter];
        } else {
          filters.labels.push(labelFilter);
        }
      } else if (spreadFilter[0] === 'e') {
        const entityFilter = getEntityFromFilter(filter);
        if (!filters.entities) {
          filters.entities = [entityFilter];
        } else {
          filters.entities.push(entityFilter);
        }
      }
    });
    return {
      ...state,
      filters,
    };
  },
);

export const labelFilters = searchState.writer<LabelFilter[]>(
  (state) => state.filters.labels || [],
  (state, labelFilters) => ({
    ...state,
    filters: {
      ...state.filters,
      labels: labelFilters,
    },
  }),
);
export const entityFilters = searchState.writer<EntityFilter[]>(
  (state) => state.filters.entities || [],
  (state, entityFilters) => ({
    ...state,
    filters: {
      ...state.filters,
      entities: entityFilters,
    },
  }),
);

export const autofilters = searchState.writer<EntityFilter[]>(
  (state) => state.filters.autofilters || [],
  (state, entityFilters) => ({
    ...state,
    filters: {
      ...state.filters,
      autofilters: entityFilters,
    },
  }),
);

export const autofilerDisabled = searchState.writer<boolean | undefined>(
  (state) => state.autofilerDisabled,
  (state, autofilerDisabled) => ({
    ...state,
    autofilerDisabled,
  }),
);

export const displayedResource = searchState.writer<DisplayedResource | null>(
  (state) => state.displayedResource,
  (state, displayedResource) => ({
    ...state,
    displayedResource,
  }),
);

export const isEmptySearchQuery = searchState.reader<boolean>(
  (state) =>
    !state.query &&
    (!state.filters.labels || state.filters.labels.length === 0) &&
    (!state.filters.entities || state.filters.entities.length === 0),
);

export const hasMore = searchState.reader<boolean>((state) => state.results.next_page);
export const loadMore = searchState.writer<number, void>(
  (state) => state.options.page_number || 0,
  (state) => ({
    ...state,
    options: { ...state.options, page_number: (state.options.page_number || 0) + 1 },
  }),
);

export const pageNumber = searchState.writer<number>(
  (state) => state.options.page_number || 0,
  (state, pageNumber) => ({
    ...state,
    options: { ...state.options, page_number: pageNumber },
  }),
);

export const pendingResults = searchState.writer<boolean>(
  (state) => state.pending,
  (state, pending) => ({ ...state, pending }),
);

export const trackingStartTime = searchState.writer<number>(
  (state) => state.tracking.startTime,
  (state, startTime) => ({ ...state, tracking: { startTime, resultsReceived: false, searchId: '', engagement: {} } }),
);

export const trackingSearchId = searchState.writer<string | undefined>(
  (state) => state.tracking.searchId,
  (state, searchId) => ({ ...state, tracking: { ...state.tracking, searchId } }),
);

export const trackingResultsReceived = searchState.writer<boolean>(
  (state) => state.tracking.resultsReceived,
  (state, resultsReceived) => ({ ...state, tracking: { ...state.tracking, resultsReceived } }),
);

export const trackingReset = searchState.writer<undefined>(
  () => undefined,
  (state) => ({ ...state, tracking: { ...state.tracking, startTime: 0, resultsReceived: false } }),
);

// emits the tracking data only after corresponding results are received
export const getTrackingDataAfterResultsReceived = combineLatest([
  trackingResultsReceived,
  trackingStartTime,
  trackingSearchId,
]).pipe(
  filter(([resultsReceived, startTime]) => resultsReceived && startTime > 0),
  map(([, startTime, searchId]) => ({ startTime, searchId })),
);

export const trackingEngagement = searchState.writer<
  Engagement,
  { type: EngagementType; rid?: string; paragraph?: Paragraph }
>(
  (state) => state.tracking.engagement,
  (state, params) => {
    const sortedResources = state.results.resultList;
    const matching = params.rid ? sortedResources.find((resource) => resource.id === params.rid) : undefined;
    return {
      ...state,
      tracking: {
        ...state.tracking,
        engagement: {
          type: params.type,
          resourceRank: matching ? sortedResources.findIndex((resource) => resource.id === params.rid) : undefined,
          paragraphRank:
            matching && params.paragraph
              ? matching.paragraphs?.findIndex((paragraph) => paragraph.id === (params.paragraph as any)?.id)
              : undefined,
          paragraphType: (params.paragraph as any)?.score_type,
          paragraphOrder: params.paragraph?.order,
        },
      },
    };
  },
);

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

export const isTitleOnly = combineLatest([searchQuery, labelFilters, entityFilters]).pipe(
  map(
    ([query, labels, entities]) =>
      !query &&
      !!labels &&
      labels.every((label) => label.kind === LabelSetKind.RESOURCES) &&
      (entities || []).length === 0,
  ),
);

export const triggerSearch: Subject<{ more: true } | void> = new Subject<{ more: true } | void>();

export const addLabelFilter = (label: Classification, kinds: LabelSetKind[]) => {
  const kind =
    kinds.length === 1 || (kinds.length > 1 && !kinds.includes(LabelSetKind.RESOURCES))
      ? kinds[0]
      : LabelSetKind.RESOURCES;
  const filter = { classification: label, kind };
  const currentFilters = labelFilters.getValue();

  if (!currentFilters.includes(filter)) {
    labelFilters.set(currentFilters.concat([filter]));
  }
};

export const removeLabelFilter = (label: Classification) => {
  const currentFilters = labelFilters.getValue();
  labelFilters.set(
    currentFilters.filter(
      (filter) => filter.classification.label !== label.label || filter.classification.labelset !== label.labelset,
    ),
  );
};

export const addEntityFilter = (entity: EntityFilter) => {
  const currentFilters = entityFilters.getValue();
  if (!currentFilters.includes(entity)) {
    entityFilters.set(currentFilters.concat([entity]));
  }
};

export const removeEntityFilter = (entity: EntityFilter) => {
  const currentFilters = entityFilters.getValue();
  entityFilters.set(
    currentFilters.filter((filter) => filter.entity !== entity.entity || filter.family !== entity.family),
  );
};

export const removeAutofilter = (entity: EntityFilter) => {
  const currentFilters = autofilters.getValue();
  autofilters.set(
    currentFilters.filter((filter) => filter.family !== entity.family || filter.entity !== entity.entity),
  );
  autofilerDisabled.set(true);
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

export function getSortedResults(resources: Search.FindResource[]): TypedResult[] {
  if (!resources) {
    return [];
  }

  const keyList: string[] = [];
  return resources.reduce((resultList, resource) => {
    const fieldEntries: TypedResult[] = Object.entries(resource.fields)
      .filter(([fullFieldId]) => {
        // filter out generic fields
        const fieldType = fullFieldId.split('/')[1];
        return fieldType !== SHORT_FIELD_TYPE.generic && shortToLongFieldType(fieldType as SHORT_FIELD_TYPE) !== null;
      })
      .map(([fullFieldId, field]) => {
        const [, shortType, fieldId] = fullFieldId.split('/');
        const fieldType = shortToLongFieldType(shortType as SHORT_FIELD_TYPE) as FIELD_TYPE;
        const dataKey = getDataKeyFromFieldType(fieldType);
        const fieldResult: Search.FieldResult = {
          ...resource,
          field: { field_id: fieldId, field_type: fieldType },
          fieldData: dataKey ? resource.data?.[dataKey]?.[fieldId] : undefined,
          paragraphs: Object.values(field.paragraphs).sort((a, b) => a.order - b.order),
        };
        const typedResult: TypedResult = {
          ...fieldResult,
          resultType: getResultType(fieldResult),
        };
        // Don't include results already displayed:
        // sometimes load more bring results which are actually the same as what we got before but with another score_type
        const uniqueKey = getResultUniqueKey(typedResult);
        if (!keyList.includes(uniqueKey)) {
          keyList.push(uniqueKey);
          return typedResult;
        } else {
          return null;
        }
      })
      .filter((typedResult) => !!typedResult)
      .map((typedResult) => typedResult as TypedResult);
    resultList = resultList.concat(fieldEntries);
    return resultList;
  }, [] as TypedResult[]);
}

export function getResultUniqueKey(result: Search.FieldResult): string {
  return `${(result.paragraphs || []).reduce((acc, curr) => `${acc}${acc.length > 0 ? '__' : ''}${curr.id}`, '')}`;
}

const SpreadsheetContentTypes = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.oasis.opendocument.spreadsheet',
];
function getResultType(result: Search.FieldResult): ResultType {
  if (result?.field?.field_type === FIELD_TYPE.link && !!result?.fieldData?.value) {
    const url = (result.fieldData as LinkFieldData).value?.uri;
    return url?.includes('youtube.com') || url?.includes('youtu.be') ? 'video' : 'text';
  } else if (result?.field?.field_type === FIELD_TYPE.conversation) {
    return 'conversation';
  } else if (result?.field?.field_type === FIELD_TYPE.file && !!result?.fieldData?.value) {
    const file = (result.fieldData as FileFieldData).value?.file;
    // for audio, video, image or text, we have a corresponding tile
    // for mimetype starting with 'application/', it is more complex:
    // - anything like a spreadsheet is a spreadsheet
    // - 'application/octet-stream' is the default generic mimetype, its means we have no idea what it is, so we use text as that's the most reliable
    // - anything else is a pdf ('application/pdf' of course, but also any MSWord, OpenOffice, etc., are converted to pdf by the backend)
    if (file?.content_type?.startsWith('audio')) {
      return 'audio';
    } else if (file?.content_type?.startsWith('video')) {
      return 'video';
    } else if (file?.content_type?.startsWith('image')) {
      return 'image';
    } else if (file?.content_type?.startsWith('text')) {
      return 'text';
    } else if (SpreadsheetContentTypes.includes(file?.content_type || '')) {
      return 'spreadsheet';
    } else if (file?.content_type?.startsWith('application/octet-stream')) {
      return 'text';
    } else if (file?.content_type?.startsWith('application')) {
      return 'pdf';
    } else {
      return 'text';
    }
  } else {
    return 'text';
  }
}
