import {
  Classification,
  Filter,
  FilterOperator,
  Resource,
  RESOURCE_STATUS,
  Search,
  SearchOptions,
  SortField,
  SortOption,
  WritableKnowledgeBox,
} from '@nuclia/core';
import { IHeaderCell } from '@guillotinaweb/pastanaga-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CREATION_END, CREATION_START } from '../resource-filters.utils';

export interface ColoredLabel extends Classification {
  color: string;
}

export interface ResourceWithLabels {
  resource: Resource;
  labels: ColoredLabel[];
  description?: string;
  status?: string;
  rank?: number;
}

export interface ColumnHeader extends IHeaderCell {
  size: string;
  optional?: boolean;
  visible?: boolean;
}

export type MenuAction = 'edit' | 'annotate' | 'classify' | 'delete' | 'reprocess' | 'summarize';

export const DEFAULT_PREFERENCES = {
  columns: ['modification', 'language'],
};
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_SORTING: SortOption = { field: SortField.created, order: 'desc' };

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
}
export function getSearchOptions(params: ResourceListParams): SearchOptions {
  const filters: Filter[] = [
    { [FilterOperator.any]: params.filters.filter((filter) => filter.startsWith('/icon/')) },
    { [FilterOperator.any]: params.filters.filter((filter) => filter.startsWith('/classification.labels/')) },
    { [FilterOperator.any]: params.status ? [`/n/s/${params.status}`] : [] },
  ].filter((item) => (Object.values(item)[0] || []).length > 0);

  return {
    page_number: params.page,
    page_size: params.pageSize,
    sort: params.sort,
    range_creation_start: params.filters.find((filter) => filter.startsWith(CREATION_START)) || undefined,
    range_creation_end: params.filters.find((filter) => filter.startsWith(CREATION_END)) || undefined,
    filters,
  };
}
export function searchResources(
  kb: WritableKnowledgeBox,
  resourceListParams: ResourceListParams,
): Observable<{ results: Search.Results; kbId: string }> {
  const searchOptions = getSearchOptions(resourceListParams);
  return kb.catalog(resourceListParams.query, searchOptions).pipe(
    map((res) => ({
      results: (res.type === 'error' ? { type: 'searchResults' } : res) as Search.Results,
      kbId: kb.id,
    })),
  );
}
