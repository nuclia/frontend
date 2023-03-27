import { Classification, Resource } from '@nuclia/core';
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
  pageSize: 20,
  columns: ['modification', 'language'],
};

export const RESOURCE_LIST_PREFERENCES = 'NUCLIA_RESOURCE_LIST_PREFERENCES';

export interface BulkAction {
  inProgress: boolean;
  total: number;
  done: number;
  label: string;
}
