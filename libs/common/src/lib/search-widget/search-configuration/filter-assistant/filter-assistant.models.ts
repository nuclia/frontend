import { OptionModel } from '@guillotinaweb/pastanaga-angular';

export interface SimpleFilter {
  type: string;
  value: string;
}

export type FilterCombiner = 'all' | 'any' | 'none' | 'not_all';
export interface FilterExpression {
  combine: FilterCombiner;
  filters: SimpleFilter[];
}

export const filterTypeList: OptionModel[] = [
  new OptionModel({
    id: 'icon',
    value: 'icon',
    label: 'search.configuration.search-box.preselected-filters.assistant.filter-type.mime-type',
  }),
  new OptionModel({
    id: 'classification.labels',
    value: 'classification.labels',
    label: 'search.configuration.search-box.preselected-filters.assistant.filter-type.labels',
  }),
  new OptionModel({
    id: 'entities',
    value: 'entities',
    label: 'search.configuration.search-box.preselected-filters.assistant.filter-type.ners',
  }),
  new OptionModel({
    id: 'metadata.status',
    value: 'metadata.status',
    label: 'search.configuration.search-box.preselected-filters.assistant.filter-type.status',
  }),
  new OptionModel({
    id: 'metadata.language',
    value: 'metadata.language',
    label: 'search.configuration.search-box.preselected-filters.assistant.filter-type.language',
  }),
  new OptionModel({
    id: 'origin.metadata',
    value: 'origin.metadata',
    label: 'search.configuration.search-box.preselected-filters.assistant.filter-type.metadata',
  }),
  new OptionModel({
    id: 'origin.path',
    value: 'origin.path',
    label: 'search.configuration.search-box.preselected-filters.assistant.filter-type.path',
  }),
  new OptionModel({
    id: 'origin.tags',
    value: 'origin.tags',
    label: 'search.configuration.search-box.preselected-filters.assistant.filter-type.tags',
  }),
];

const simpleFilterRegex = /^\/([\w.]+)\/(.+)/;

export function mapToSimpleFilter(value: string): SimpleFilter | undefined {
  if (!value.startsWith('/')) {
    return undefined;
  }
  const found = value.match(simpleFilterRegex);
  if (found && found[1] && found[2]) {
    const type = found[1];
    const value = found[2];
    return { type, value };
  } else {
    return undefined;
  }
}

export function getCombineKey(value: any): FilterCombiner | null {
  const keys = Object.keys(value);
  if (keys.length > 1 || !['all', 'any', 'none', 'not_all'].includes(keys[0])) {
    return null;
  }
  return keys[0] as FilterCombiner;
}

export function getFiltersFromExpression(
  value: { [key: string]: any },
  combiner: FilterCombiner,
): SimpleFilter[] | null {
  const filters = value[combiner];
  if (!Array.isArray(filters)) {
    return null;
  }
  return filters.map((filter) => mapToSimpleFilter(filter)).filter((filter) => !!filter);
}
