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
    id: 'creation_date',
    value: 'creation_date',
    label: 'search.configuration.search-box.preselected-filters.assistant.filter-type.creation-date',
  }),
  new OptionModel({
    id: 'modification_date',
    value: 'modification_date',
    label: 'search.configuration.search-box.preselected-filters.assistant.filter-type.modification-date',
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
