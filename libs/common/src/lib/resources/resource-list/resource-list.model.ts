import { Classification, Resource, SortField, SortOption } from '@nuclia/core';
import { IHeaderCell } from '@guillotinaweb/pastanaga-angular';

export interface ColoredLabel extends Classification {
  color: string;
}

export interface ResourceWithLabels {
  resource: Resource;
  labels: ColoredLabel[];
  description?: string;
  status?: string;
}

export interface ColumnHeader extends IHeaderCell {
  size: string;
  optional?: boolean;
  visible?: boolean;
}

export type MenuAction = 'edit' | 'annotate' | 'classify' | 'delete' | 'reprocess';

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
  label: string;
}
