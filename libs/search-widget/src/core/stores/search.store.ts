import type {
  ChatOptions,
  Classification,
  FieldId,
  Filter,
  FilterExpression,
  IErrorResponse,
  IFieldData,
  IResource,
  Paragraph,
  ReasoningParam,
  ResourceData,
  ResourceField,
  Search,
  SearchOptions,
} from '@nuclia/core';
import {
  FIELD_TYPE,
  FileFieldData,
  FilterOperator,
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
  MIME_FILTER_PREFIX,
  NER_FILTER_PREFIX,
  parsePreselectedFilters,
  PATH_FILTER_PREFIX,
  ResourceProperties,
  SHORT_FIELD_TYPE,
  shortToLongFieldType,
} from '@nuclia/core';
import { combineLatest, filter, map, Observable, Subject } from 'rxjs';
import type { LabelFilter } from '../../common';
import type { FindResultsAsList, RankedFieldResult, ResultMetadata, ResultType, TypedResult } from '../models';
import { NO_RESULT_LIST } from '../models';
import { SvelteState } from '../state-lib';
import { getResultMetadata } from '../utils';
import { labelSets } from './labels.store';
import { getMimeFromFilter, type MimeFacet, type MimeFilter } from './mime.store';
import { orFilterLogic } from './widget.store';

interface SearchFilters {
  labels?: LabelFilter[];
  labelSets?: LabelSetFilter[];
  entities?: EntityFilter[];
  autofilters?: EntityFilter[];
  mimeTypes?: MimeFilter[];
  path?: string;
}

export interface LabelSetFilter {
  id: string;
  kind: LabelSetKind;
}
export interface EntityFilter {
  family: string;
  entity: string;
}
export type ResultsOrder = 'relevance' | 'date';

type EngagementType = 'CHAT' | 'RESULT';

const EXTENDED_RESULTS = 100;

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
  creation?: {
    range_creation_start?: string;
    range_creation_end?: string;
  };
  preselectedFilters: string[] | Filter[];
  filterExpression?: FilterExpression;
  options: SearchOptions;
  search_config_id?: string;
  show: ResourceProperties[];
  results: FindResultsAsList;
  error?: IErrorResponse;
  pending: boolean;
  autofilerDisabled?: boolean;
  showResults: boolean;
  showAttachedImages: boolean;
  tracking: {
    startTime: number;
    resultsReceived: boolean;
    searchId: string | undefined;
    engagement: Engagement;
  };
  metadata: ResultMetadata;
  images: {
    content_type: string;
    b64encoded: string;
  }[];
  resultsOrder: ResultsOrder;
  noScroll: boolean;
  reasoning: ReasoningParam;
}

export const searchState = new SvelteState<SearchState>({
  query: '',
  filters: {},
  preselectedFilters: [],
  filterExpression: undefined,
  options: {},
  search_config_id: undefined,
  show: [ResourceProperties.BASIC, ResourceProperties.VALUES, ResourceProperties.ORIGIN],
  results: NO_RESULT_LIST,
  pending: false,
  showResults: false,
  showAttachedImages: false,
  tracking: {
    startTime: 0,
    resultsReceived: false,
    searchId: undefined,
    engagement: {},
  },
  metadata: {
    origin: [],
    field: [],
    extra: [],
  },
  images: [],
  resultsOrder: 'relevance',
  noScroll: false,
  reasoning: false,
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
        resultList: params.append
          ? state.results.resultList.concat(excludeResults(sortedResults, state.results.resultList))
          : sortedResults,
      },
      pending: false,
      showResults: true,
      resultsOrder: params.append ? state.resultsOrder : 'relevance',
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
  const list = state.results.resultList.map((result) => {
    const metadataValues = getResultMetadata(state.metadata, result, result.fieldData);
    if (metadataValues.length > 0) {
      result.resultMetadata = metadataValues;
    }
    return result;
  });
  if (state.resultsOrder === 'date') {
    list.sort((a, b) => {
      const createdA = a.origin?.created || a.created || '';
      const createdB = b.origin?.created || b.created || '';
      return createdA === createdB ? 0 : createdA < createdB ? 1 : -1;
    });
  }
  return list;
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

export const showAttachedImages = searchState.writer<boolean>(
  (state) => state.showAttachedImages,
  (state, showAttachedImages) => ({
    ...state,
    showAttachedImages,
  }),
);

export const preselectedFilters = searchState.writer<string[] | Filter[], string>(
  (state) => state.preselectedFilters,
  (state, preselectedFilters) => {
    return {
      ...state,
      preselectedFilters: parsePreselectedFilters(preselectedFilters),
    };
  },
);

export const filterExpression = searchState.writer<FilterExpression | undefined>(
  (state) => state.filterExpression,
  (state, filterExpression) => {
    return {
      ...state,
      filterExpression,
    };
  },
);

export const reasoningParam = searchState.writer<ReasoningParam>(
  (state) => state.reasoning,
  (state, reasoning) => {
    return {
      ...state,
      reasoning,
    };
  },
);

export const resultsOrder = searchState.writer<ResultsOrder>(
  (state) => state.resultsOrder,
  (state, resultsOrder) => ({
    ...state,
    resultsOrder,
  }),
);

export const searchFilters = searchState.writer<string[], { filters: string[] }>(
  (state) => [
    ...(state.filters.labels || []).map((filter) => getFilterFromLabel(filter.classification)),
    ...(state.filters.labelSets || []).map((filter) => getFilterFromLabelSet(filter.id)),
    ...(state.filters.entities || []).map((filter) => getFilterFromEntity(filter)),
    ...(state.filters.mimeTypes || []).map((filter) => filter.key),
    ...(state.filters.path ? [state.filters.path] : []),
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
      } else if (spreadFilter[0] === MIME_FILTER_PREFIX) {
        const mimeFilter = getMimeFromFilter(filter);
        if (!filters.mimeTypes) {
          filters.mimeTypes = [mimeFilter];
        } else {
          filters.mimeTypes.push(mimeFilter);
        }
      } else if (spreadFilter[0] === PATH_FILTER_PREFIX) {
        filters.path = filter;
      }
    });
    return {
      ...state,
      filters,
    };
  },
);

export const rangeCreationISO = searchState.reader<{ start?: string; end?: string } | undefined>((state) => ({
  start: state.creation?.range_creation_start,
  end: state.creation?.range_creation_end,
}));

export const combinedFilters = combineLatest([searchFilters, preselectedFilters, orFilterLogic]).pipe(
  map(([searchFilters, preselectedFilters, orFilterLogic]) => {
    const filterOperator = orFilterLogic ? FilterOperator.any : FilterOperator.all;
    const filters: Filter[] = searchFilters.length > 0 ? [{ [filterOperator]: searchFilters }] : [];
    if (preselectedFilters.length === 0) {
      return filters;
    } else {
      const isAdvancedFilters = preselectedFilters.every((filter) => typeof filter === 'object');
      return isAdvancedFilters ? filters.concat(preselectedFilters) : filters.concat([{ all: preselectedFilters }]);
    }
  }),
);

export const combinedFilterExpression: Observable<FilterExpression> = combineLatest([
  searchState.reader<SearchFilters>((state) => state.filters),
  orFilterLogic,
  filterExpression,
  labelSets,
  rangeCreationISO,
]).pipe(
  map(([filters, orFilterLogic, filterExpression, labelSets, rangeCreation]) => {
    if (
      ((filterExpression?.operator === 'and' || !filterExpression?.operator) && orFilterLogic) ||
      (filterExpression?.operator === 'or' && !orFilterLogic)
    ) {
      // Filters cannot be combined if filters operator and filter expression operator are not the same
      return filterExpression || {};
    }
    const fieldFilters = {
      [orFilterLogic ? 'or' : 'and']: [
        ...(filters.entities || []).map((entity) => ({
          prop: 'entity',
          subtype: entity.family,
          value: entity.entity,
        })),
        ...(filters.labels || [])
          .filter((label) => labelSets[label.classification.labelset]?.kind.includes(LabelSetKind.RESOURCES))
          .map((label) => ({
            prop: 'label',
            labelset: label.classification.labelset,
            label: label.classification.label,
          })),
        ...(filters.labelSets || [])
          .filter((labelset) => labelSets[labelset.id]?.kind.includes(LabelSetKind.RESOURCES))
          .map((labelset) => ({ prop: 'label', labelset: labelset.id })),
        ...(filters.mimeTypes || []).map((mimeType) => ({
          prop: 'field_mimetype',
          type: mimeType.key,
        })),
        ...(filters.path ? [filters.path] : []).map((path) => ({
          prop: 'origin_path',
          prefix: path.split(PATH_FILTER_PREFIX)[1],
        })),
        ...(rangeCreation?.start || rangeCreation?.end
          ? [{ prop: 'created', since: rangeCreation?.start, until: rangeCreation?.end }]
          : []),
      ],
    };
    const paragraphFilters = {
      [orFilterLogic ? 'or' : 'and']: [
        ...(filters.labels || [])
          .filter((label) => labelSets[label.classification.labelset]?.kind.includes(LabelSetKind.PARAGRAPHS))
          .map((label) => ({
            prop: 'label',
            labelset: label.classification.labelset,
            label: label.classification.label,
          })),
        ...(filters.labelSets || [])
          .filter((labelset) => labelSets[labelset.id]?.kind.includes(LabelSetKind.PARAGRAPHS))
          .map((labelset) => ({ prop: 'label', labelset: labelset.id })),
      ],
    };
    const hasFieldFilters = Object.values(fieldFilters)[0].length > 0;
    const hasParagraphFilters = Object.values(paragraphFilters)[0].length > 0;
    return {
      ...(filterExpression || {}),
      field:
        filterExpression?.field && hasFieldFilters
          ? {
              and: [filterExpression.field, fieldFilters],
            }
          : hasFieldFilters
            ? fieldFilters
            : filterExpression?.field,
      paragraph:
        filterExpression?.paragraph && hasParagraphFilters
          ? {
              and: [filterExpression.paragraph, paragraphFilters],
            }
          : hasParagraphFilters
            ? paragraphFilters
            : filterExpression?.paragraph,
    };
  }),
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

export const mimeTypesfilters = searchState.writer<MimeFilter[]>(
  (state) => state.filters.mimeTypes || [],
  (state, mimeTypesfilters) => ({
    ...state,
    filters: {
      ...state.filters,
      mimeTypes: mimeTypesfilters,
    },
  }),
);

export const pathFilter = searchState.writer<string | undefined>(
  (state) => state.filters.path,
  (state, pathFilter) => ({
    ...state,
    filters: {
      ...state.filters,
      path: pathFilter,
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
    state.creation?.range_creation_start && new Date(state.creation.range_creation_start).toISOString().slice(0, 10),
  (state, date) => ({
    ...state,
    creation: {
      ...state.creation,
      range_creation_start: date && new Date(date).toISOString(),
    },
  }),
);

export const creationEnd = searchState.writer<string | undefined>(
  (state) =>
    state.creation?.range_creation_end && new Date(state.creation.range_creation_end).toISOString().slice(0, 10),
  (state, date) => ({
    ...state,
    creation: {
      ...state.creation,
      range_creation_end: date && new Date(`${date}T23:59:59.000Z`).toISOString(),
    },
  }),
);

export const rangeCreation = combineLatest([creationStart, creationEnd]).pipe(map(([start, end]) => ({ start, end })));
export const hasRangeCreation = combineLatest([creationStart, creationEnd]).pipe(
  map(([start, end]) => !!start || !!end),
);

export const isEmptySearchQuery = searchState.reader<boolean>(
  (state) =>
    !state.query &&
    (!state.filters.labels || state.filters.labels.length === 0) &&
    (!state.filters.labelSets || state.filters.labelSets.length === 0) &&
    (!state.filters.entities || state.filters.entities.length === 0) &&
    (!state.filters.mimeTypes || state.filters.mimeTypes.length === 0) &&
    !state.filters.path &&
    !state.creation?.range_creation_start &&
    !state.creation?.range_creation_end,
);

export const hasMore = searchState.reader<boolean>((state) => state.options.top_k !== EXTENDED_RESULTS);
export const loadMore = searchState.writer<number, void>(
  (state) => (state.options.top_k === EXTENDED_RESULTS ? 1 : 0),
  (state) => ({
    ...state,
    options: { ...state.options, top_k: EXTENDED_RESULTS },
  }),
);

export const pageNumber = searchState.writer<number>(
  (state) => (state.options.top_k === EXTENDED_RESULTS ? 1 : 0),
  (state, page) => {
    const { top_k, ...rest } = state.options;
    return {
      ...state,
      options: page === 0 ? rest : { ...rest, top_k: EXTENDED_RESULTS },
    };
  },
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

export const images = searchState.writer<
  {
    content_type: string;
    b64encoded: string;
  }[],
  {
    content_type: string;
    b64encoded: string;
  }[]
>(
  (state) => state.images,
  (state, images) => ({
    ...state,
    images,
  }),
);

export const noScroll = searchState.writer<boolean>(
  (state) => state.noScroll,
  (state, noScroll) => ({
    ...state,
    noScroll,
  }),
);

export function addImage(fileObj: File) {
  const reader = new FileReader();
  reader.readAsDataURL(fileObj);
  reader.onload = () => {
    const base64 = reader.result as string;
    const content_type = fileObj.type;
    images.set([...images.getValue(), { content_type, b64encoded: base64.split(',')[1] }]);
  };
}

export function removeImage(index: number) {
  const currentImages = images.getValue();
  if (currentImages[index]) {
    currentImages.splice(index, 1);
    images.set(currentImages);
  }
}

function getType(value: string): 'string' | 'list' | 'date' {
  const parts = value.split(':');
  if (parts.length > 2) {
    const type = parts[2];
    if (type === 'string' || type === 'list' || type === 'date') {
      return type as 'string' | 'list' | 'date';
    }
  }
  return 'string';
}

function getTitle(value: string): string | undefined {
  const parts = value.split(':');
  if (parts.length === 4) {
    return parts[3];
  }
  return;
}
export const displayedMetadata = searchState.writer<ResultMetadata, string>(
  (state) => state.metadata,
  (state, params) => {
    const values = params.split(',');
    const metadata: ResultMetadata = {
      origin: values
        .filter((value) => value.startsWith('origin'))
        .map((value) => ({ path: value.split(':')[1], type: getType(value), title: getTitle(value) })),
      field: values
        .filter((value) => value.startsWith('field'))
        .map((value) => ({ path: value.split(':')[1], type: getType(value), title: getTitle(value) })),
      extra: values
        .filter((value) => value.startsWith('extra'))
        .map((value) => ({ path: value.split(':')[1], type: getType(value), title: getTitle(value) })),
    };
    return {
      ...state,
      metadata,
      show: metadata.extra.length > 0 ? [...state.show, ResourceProperties.EXTRA] : state.show,
    };
  },
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

export const rephrasedQuery = searchState.reader((state) => state.results.rephrased_query);

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
  if (!currentFilters.find((filter) => filter.family === entity.family && filter.entity === entity.entity)) {
    entityFilters.set(currentFilters.concat([entity]));
  }
};

export const removeEntityFilter = (entity: EntityFilter) => {
  const currentFilters = entityFilters.getValue();
  entityFilters.set(
    currentFilters.filter((filter) => filter.entity !== entity.entity || filter.family !== entity.family),
  );
};

export const addMimeFilter = (mimeFacet: MimeFacet) => {
  const currentFilters = mimeTypesfilters.getValue();
  if (!currentFilters.find((filter) => filter.key === mimeFacet.facet.key)) {
    mimeTypesfilters.set(currentFilters.concat([{ key: mimeFacet.facet.key, label: mimeFacet.label }]));
  }
};

export const removeMimeFilter = (mimeKey: string) => {
  const currentFilters = mimeTypesfilters.getValue();
  mimeTypesfilters.set(currentFilters.filter((filter) => filter.key !== mimeKey));
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
    const dataFieldCount = Object.keys(resource.fields).filter((fid) => !fid.startsWith('/a/')).length;
    const fieldEntries: TypedResult[] = Object.entries(resource.fields)
      .filter(([fullFieldId]) => {
        const fieldType = fullFieldId.split('/')[1];
        // filter out generic fields when there are also data fields
        return fieldCount === 1
          ? true
          : (dataFieldCount === 0 || !fullFieldId.startsWith('/a/')) &&
              shortToLongFieldType(fieldType as SHORT_FIELD_TYPE) !== null;
      })
      .map(([fullFieldId, field]) => {
        let [, shortType, field_id] = fullFieldId.split('/');
        const field_type = shortToLongFieldType(shortType as SHORT_FIELD_TYPE) as FIELD_TYPE;
        const fieldId: FieldId = { field_id, field_type };
        const fieldResult: RankedFieldResult = {
          ...resource,
          field: fieldId,
          fieldData: getFieldDataFromResource(resource, fieldId),
          paragraphs:
            fullFieldId !== '/a/title' ? Object.values(field.paragraphs).sort((a, b) => a.order - b.order) || [] : [],
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

function excludeResults(results: TypedResult[], excluded: TypedResult[]): TypedResult[] {
  const excludedParagraphsIds = excluded.reduce(
    (acc, curr) => acc.concat(curr.paragraphs.map((p) => p.id)),
    [] as string[],
  );
  return results
    .map((result) => {
      return {
        ...result,
        paragraphs: result.paragraphs.filter((paragraph) => !excludedParagraphsIds.includes(paragraph.id)),
      };
    })
    .filter((result) => result.paragraphs.length > 0);
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

export function getNonGenericField(data: ResourceData) {
  return Object.entries(data)
    .filter(([, data]) => !!data)
    .map(([dataKey, data]) => {
      // data key is matching field type with an `s` suffix
      const fieldType = getFieldTypeFromString(dataKey.substring(0, dataKey.length - 1));
      return { field_type: fieldType as FIELD_TYPE, field_id: Object.keys(data)[0] };
    })
    .filter((fullId) => {
      return fullId.field_type !== FIELD_TYPE.generic;
    })[0];
}

export const searchConfigId = searchState.writer<string | undefined>(
  (state) => state.search_config_id,
  (state, config) => ({
    ...state,
    search_config_id: config,
  }),
);
