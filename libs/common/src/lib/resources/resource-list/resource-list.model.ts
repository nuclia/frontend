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
  status: RESOURCE_STATUS;
  page: number;
  pageSize: number;
  sort: SortOption;
  query: string;
  titleOnly: boolean;
  filters: string[];
}
export function getSearchOptions(params: ResourceListParams): {
  searchOptions: SearchOptions;
  searchFeatures: Search.Features[];
} {
  const filters: Filter[] = [
    { [FilterOperator.any]: params.filters.filter((filter) => filter.startsWith('/icon/')) },
    { [FilterOperator.any]: params.filters.filter((filter) => filter.startsWith('/classification.labels/')) },
    { [FilterOperator.any]: params.status === RESOURCE_STATUS.PROCESSED ? [] : [`/n/s/${params.status}`] },
  ].filter((item) => (Object.values(item)[0] || []).length > 0);

  const searchOptions: SearchOptions = {
    page_number: params.page,
    page_size: params.pageSize,
    sort: params.sort,
    filters,
    with_status: params.status === RESOURCE_STATUS.PROCESSED ? params.status : undefined,
  };
  const searchFeatures =
    params.query.length > 0
      ? [Search.Features.PARAGRAPH, Search.Features.VECTOR, Search.Features.DOCUMENT]
      : [Search.Features.DOCUMENT];
  return {
    searchOptions,
    searchFeatures,
  };
}
export function searchResources(
  kb: WritableKnowledgeBox,
  resourceListParams: ResourceListParams,
): Observable<{ results: Search.Results; kbId: string }> {
  const { searchOptions, searchFeatures } = getSearchOptions(resourceListParams);
  const getResults = resourceListParams.titleOnly
    ? kb.catalog(resourceListParams.query, searchOptions)
    : kb.search(resourceListParams.query, searchFeatures, searchOptions);
  return getResults.pipe(
    map((res) => ({
      results: (res.type === 'error' ? { type: 'searchResults' } : res) as Search.Results,
      kbId: kb.id,
    })),
  );
}
