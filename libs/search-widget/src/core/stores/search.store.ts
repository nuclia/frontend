import { SvelteState } from '../state-lib';
import type {
  Classification,
  FieldId,
  IErrorResponse,
  IFieldData,
  IResource,
  Paragraph,
  ResourceField,
  Search,
  SearchOptions,
} from '@nuclia/core';
import {
  FIELD_TYPE,
  FileFieldData,
  getDataKeyFromFieldType,
  getEntityFromFilter,
  getFieldTypeFromString,
  getFilterFromEntity,
  getFilterFromLabel,
  getFilterFromLabelSet,
  getLabelFromFilter,
  getLabelSetFromFilter,
  LABEL_FILTER_PREFIX,
  LabelSetKind,
  LinkFieldData,
  NER_FILTER_PREFIX,
  ResourceProperties,
  SHORT_FIELD_TYPE,
  shortToLongFieldType,
} from '@nuclia/core';
import type { FindResultsAsList, ResultType, TypedResult } from '../models';
import { NO_RESULT_LIST } from '../models';
import { combineLatest, filter, map, Observable, Subject } from 'rxjs';
import type { LabelFilter } from '../../common';

interface SearchFilters {
  labels?: LabelFilter[];
  labelSets?: LabelSetFilter[];
  entities?: EntityFilter[];
  autofilters?: EntityFilter[];
}

export interface EntityFilter {
  family: string;
  entity: string;
}

export interface LabelSetFilter {
  id: string;
  kind: LabelSetKind;
}

type EngagementType = 'CHAT' | 'RESULT';

interface Engagement {
  type?: EngagementType;
  searchId?: string;
  resourceRank?: number;
  paragraphRank?: number;
  paragraphType?: Search.FindScoreType;
  paragraphOrder?: number;
}

interface SearchState {
  query: string;
  filters: SearchFilters;
  preselectedFilters: string[];
  options: SearchOptions;
  show: ResourceProperties[];
  results: FindResultsAsList;
  error?: IErrorResponse;
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
  preselectedFilters: [],
  options: { highlight: true, page_number: 0 },
  show: [ResourceProperties.BASIC, ResourceProperties.VALUES, ResourceProperties.ORIGIN],
  results: NO_RESULT_LIST,
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

export const resultList = searchState.reader<TypedResult[]>((state) => {
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

export const searchShow = searchState.writer<ResourceProperties[]>(
  (state) => state.show,
  (state, show) => ({
    ...state,
    show,
  }),
);

export const preselectedFilters = searchState.writer<string[]>(
  (state) => state.preselectedFilters,
  (state, preselectedFilters) => ({
    ...state,
    preselectedFilters,
  }),
);

export const searchFilters = searchState.writer<string[], { filters: string[] }>(
  (state) => [
    ...(state.filters.labels || []).map((filter) => getFilterFromLabel(filter.classification)),
    ...(state.filters.labelSets || []).map((filter) => getFilterFromLabelSet(filter.id)),
    ...(state.filters.entities || []).map((filter) => getFilterFromEntity(filter)),
  ],
  (state, data) => {
    const filters: SearchFilters = {};
    data.filters.forEach((filter) => {
      const spreadFilter = filter.split('/').filter((val) => !!val);
      if (spreadFilter[0] === LABEL_FILTER_PREFIX) {
        if (spreadFilter.length === 3) {
          const labelFilter = {
            classification: getLabelFromFilter(filter),
            kind: LabelSetKind.PARAGRAPHS,
          };
          if (!filters.labels) {
            filters.labels = [labelFilter];
          } else {
            filters.labels.push(labelFilter);
          }
        } else {
          const labelSetFilter = {
            id: getLabelSetFromFilter(filter),
            kind: LabelSetKind.PARAGRAPHS,
          };
          if (!filters.labelSets) {
            filters.labelSets = [labelSetFilter];
          } else {
            filters.labelSets.push(labelSetFilter);
          }
        }
      } else if (spreadFilter[0] === NER_FILTER_PREFIX) {
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
export const labelSetFilters = searchState.writer<LabelSetFilter[]>(
  (state) => state.filters.labelSets || [],
  (state, filters) => ({
    ...state,
    filters: {
      ...state.filters,
      labelSets: filters,
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

export const creationStart = searchState.writer<string | undefined>(
  (state) =>
    state.options.range_creation_start && new Date(state.options.range_creation_start).toISOString().slice(0, 10),
  (state, date) => ({
    ...state,
    options: {
      ...state.options,
      range_creation_start: date && new Date(date).toISOString(),
    },
  }),
);

export const creationEnd = searchState.writer<string | undefined>(
  (state) => state.options.range_creation_end && new Date(state.options.range_creation_end).toISOString().slice(0, 10),
  (state, date) => ({
    ...state,
    options: {
      ...state.options,
      range_creation_end: date && new Date(`${date}T23:59:59.000Z`).toISOString(),
    },
  }),
);

export const rangeCreation = combineLatest([creationStart, creationEnd]).pipe(map(([start, end]) => ({ start, end })));
export const hasRangeCreation = combineLatest([creationStart, creationEnd]).pipe(map(([start, end]) => start || end));

export const isEmptySearchQuery = searchState.reader<boolean>(
  (state) =>
    !state.query &&
    (!state.filters.labels || state.filters.labels.length === 0) &&
    (!state.filters.labelSets || state.filters.labelSets.length === 0) &&
    (!state.filters.entities || state.filters.entities.length === 0) &&
    !state.options.range_creation_start &&
    !state.options.range_creation_end,
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
          searchId: state.tracking.searchId,
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
        .reduce(
          (acc, current) => {
            if (!acc[current.relation_label]) {
              acc[current.relation_label] = [current.entity];
            } else {
              acc[current.relation_label].push(current.entity);
            }
            return acc;
          },
          {} as { [relation: string]: string[] },
        ),
    }))
    .filter((entity) => Object.keys(entity.relations).length > 0),
);

export const triggerSearch: Subject<{ more: true } | void> = new Subject<{ more: true } | void>();

export const addLabelFilter = (label: Classification, kinds: LabelSetKind[]) => {
  const kind =
    kinds.length === 1 || (kinds.length > 1 && !kinds.includes(LabelSetKind.RESOURCES))
      ? kinds[0]
      : LabelSetKind.RESOURCES;
  const filter = { classification: label, kind };
  const currentFilters = labelFilters.getValue();

  if (
    !currentFilters.some(
      (current) => current.classification.labelset === label.labelset && current.classification.label === label.label,
    )
  ) {
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

export const addLabelSetFilter = (id: string, kinds: LabelSetKind[]) => {
  const kind =
    kinds.length === 1 || (kinds.length > 1 && !kinds.includes(LabelSetKind.RESOURCES))
      ? kinds[0]
      : LabelSetKind.RESOURCES;
  const filter = { id, kind };
  const currentFilters = labelSetFilters.getValue();
  if (!currentFilters.map((filter) => filter.id).includes(filter.id)) {
    labelSetFilters.set(currentFilters.concat([filter]));
  }
};

export const removeLabelSetFilter = (id: string) => {
  const currentFilters = labelSetFilters.getValue();
  labelSetFilters.set(currentFilters.filter((filter) => filter.id !== id));
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

export function getSortedResults(resources?: Search.FindResource[]): TypedResult[] {
  if (!resources) {
    return [];
  }

  const keyList: string[] = [];
  return resources.reduce((resultList, resource) => {
    const fieldCount = Object.keys(resource.fields).length;
    const fieldEntries: TypedResult[] = Object.entries(resource.fields)
      .filter(([fullFieldId]) => {
        // filter out title field when it’s not the only field
        const fieldType = fullFieldId.split('/')[1];
        return fieldCount === 1
          ? true
          : fullFieldId !== '/a/title' && shortToLongFieldType(fieldType as SHORT_FIELD_TYPE) !== null;
      })
      .map(([fullFieldId, field]) => {
        let [, shortType, field_id] = fullFieldId.split('/');
        let fieldId: FieldId;

        if (shortType === SHORT_FIELD_TYPE.generic && resource.data) {
          // if matching field is generic, we take the first other field from resource data
          fieldId = Object.entries(resource.data)
            .filter(([, data]) => !!data)
            .map(([dataKey, data]) => {
              // data key is matching field type with an `s` suffix
              const fieldType = getFieldTypeFromString(dataKey.substring(0, dataKey.length - 1));
              return { field_type: fieldType as FIELD_TYPE, field_id: Object.keys(data)[0] };
            })
            .filter((fullId) => {
              return fullId.field_type !== FIELD_TYPE.generic;
            })[0];
        } else {
          const field_type = shortToLongFieldType(shortType as SHORT_FIELD_TYPE) as FIELD_TYPE;
          fieldId = { field_id, field_type };
        }
        const fieldResult: Search.FieldResult = {
          ...resource,
          field: fieldId,
          fieldData: getFieldDataFromResource(resource, fieldId),
          paragraphs:
            fullFieldId !== '/a/title' ? Object.values(field.paragraphs).sort((a, b) => a.order - b.order) : [],
        };
        const { resultType, resultIcon } = getResultType(fieldResult);
        const typedResult: TypedResult = {
          ...fieldResult,
          resultType,
          resultIcon,
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

export function getFieldDataFromResource(resource: IResource, field: FieldId): IFieldData | undefined {
  if (!field) {
    return;
  }
  const dataKey = getDataKeyFromFieldType(field.field_type);
  return dataKey ? resource.data?.[dataKey]?.[field.field_id] : undefined;
}

export function getResultUniqueKey(result: Search.FieldResult): string {
  return result.paragraphs && result.paragraphs.length > 0
    ? `${(result.paragraphs || []).reduce((acc, curr) => `${acc}${acc.length > 0 ? '__' : ''}${curr.id}`, '')}`
    : result.id;
}

const SpreadsheetContentTypes = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.oasis.opendocument.spreadsheet',
];
export function getResultType(result: Search.FieldResult): { resultType: ResultType; resultIcon: string } {
  const fieldType = result?.field?.field_type;
  const fieldDataValue = result?.fieldData?.value;
  let resultType: ResultType;
  let icon = '';
  if (fieldType === FIELD_TYPE.link && !!fieldDataValue) {
    const url = (result.fieldData as LinkFieldData).value?.uri;
    resultType = url?.includes('youtube.com') || url?.includes('youtu.be') ? 'video' : 'text';
  } else if (fieldType === FIELD_TYPE.conversation) {
    resultType = 'conversation';
  } else if (fieldType === FIELD_TYPE.file && !!fieldDataValue) {
    const file = (result.fieldData as FileFieldData).value?.file;
    // for audio, video, image or text, we have a corresponding tile
    // for mimetype starting with 'application/', it is more complex:
    // - anything like a spreadsheet is a spreadsheet
    // - 'application/octet-stream' is the default generic mimetype, its means we have no idea what it is, so we use text as that's the most reliable
    // - anything else is a pdf ('application/pdf' of course, but also any MSWord, OpenOffice, etc., are converted to pdf by the backend)
    if (file?.content_type?.startsWith('audio')) {
      resultType = 'audio';
    } else if (file?.content_type?.startsWith('video')) {
      resultType = 'video';
    } else if (file?.content_type?.startsWith('image')) {
      resultType = 'image';
    } else if (file?.content_type?.startsWith('text')) {
      resultType = 'text';
    } else if (SpreadsheetContentTypes.includes(file?.content_type || '')) {
      resultType = 'spreadsheet';
    } else if (file?.content_type?.startsWith('application/octet-stream')) {
      resultType = 'text';
    } else if (file?.content_type?.startsWith('application')) {
      resultType = 'pdf';
      icon = file?.content_type === 'application/pdf' ? 'file-pdf' : 'file-empty';
    } else {
      resultType = 'text';
    }
  } else {
    resultType = 'text';
  }
  return { resultType, resultIcon: icon || resultType };
}
