import { IHeaderCell } from '@guillotinaweb/pastanaga-angular';
import {
  CatalogOptions,
  Classification,
  CREATION_END_PREFIX,
  CREATION_START_PREFIX,
  Filter,
  FilterOperator,
  getDateFromFilter,
  getVisibilityFromFilter,
  HIDDEN_PREFIX,
  Resource,
  RESOURCE_STATUS,
  Search,
  SortField,
  SortOption,
  WritableKnowledgeBox,
} from '@nuclia/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ColoredLabel extends Classification {
  color: string;
}

export interface ResourceWithLabels {
  resource: Resource;
  labels: ColoredLabel[];
  description?: string;
  status?: string;
  rank?: number;
  errors?: string;
}

export interface ColumnHeader extends IHeaderCell {
  size: string;
  optional?: boolean;
  visible?: boolean;
}

export type MenuAction = 'edit' | 'annotate' | 'classify' | 'delete' | 'reprocess' | 'summarize' | 'hide' | 'unhide';

export const DEFAULT_PREFERENCES = {
  columns: ['modification', 'language'],
};
export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZES = [25, 50, 100];
export const DEFAULT_SORTING: SortOption = { field: SortField.created, order: 'desc' };

export type LabelsLogic = 'OR' | 'AND';
export const DEFAULT_LABELS_LOGIC = 'OR';

export const RESOURCE_LIST_PREFERENCES = 'NUCLIA_RESOURCE_LIST_PREFERENCES';

export interface BulkAction {
  inProgress: boolean;
  total: number;
  done: number;
  errors: number;
  label: string;
}

export interface ResourceListParams {
  status?: RESOURCE_STATUS;
  page: number;
  pageSize: number;
  sort: SortOption;
  query: string;
  filters: string[];
  labelsLogic?: LabelsLogic;
}
export function getSearchOptions(params: ResourceListParams, uid?: string, slug?: string): CatalogOptions {
  if (uid) {
    return {
      filter_expression: {
        resource: {
          prop: 'resource',
          id: uid,
        },
      },
    };
  } else if (slug) {
    return {
      filter_expression: {
        resource: {
          prop: 'resource',
          slug,
        },
      },
    };
  } else {
    const labelsOperator = params.labelsLogic === 'AND' ? FilterOperator.all : FilterOperator.any;
    const filters: Filter[] = [
      { [FilterOperator.any]: params.filters.filter((filter) => filter.startsWith('/icon/')) },
      { [labelsOperator]: params.filters.filter((filter) => filter.startsWith('/classification.labels/')) },
      { [FilterOperator.any]: params.status ? [`/n/s/${params.status}`] : [] },
    ].filter((item) => (Object.values(item)[0] || []).length > 0);
    const start = params.filters.find((filter) => filter.startsWith(CREATION_START_PREFIX));
    const end = params.filters.find((filter) => filter.startsWith(CREATION_END_PREFIX));
    const hiddenFilter = params.filters.find((filter) => filter.startsWith(HIDDEN_PREFIX));

    return {
      page_number: params.page,
      page_size: params.pageSize,
      sort: params.sort,
      range_creation_start: start ? getDateFromFilter(start) : undefined,
      range_creation_end: end ? getDateFromFilter(end) : undefined,
      hidden: hiddenFilter ? getVisibilityFromFilter(hiddenFilter) : undefined,
      filters,
    };
  }
}
export function searchResources(
  kb: WritableKnowledgeBox,
  resourceListParams: ResourceListParams,
  uid?: string,
  slug?: string,
): Observable<{ results: Search.Results; kbId: string }> {
  const searchOptions = getSearchOptions(resourceListParams, uid, slug);
  return kb.catalog(uid || slug ? '' : resourceListParams.query, searchOptions).pipe(
    map((res) => ({
      results: (res.type === 'error' ? { type: 'searchResults' } : res) as Search.Results,
      kbId: kb.id,
    })),
  );
}

export function formatQuery(query: string) {
  return query.trim();
}
