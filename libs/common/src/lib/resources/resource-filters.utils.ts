import { OptionModel } from '@guillotinaweb/pastanaga-angular';
import {
  CREATION_END_PREFIX,
  CREATION_START_PREFIX,
  getDateFromFilter,
  getVisibilityFromFilter,
  HIDDEN_PREFIX,
  Search,
} from '@nuclia/core';
import mime from 'mime';

export interface Filters {
  classification: OptionModel[];
  mainTypes: OptionModel[];
  languages?: OptionModel[];
  creation: {
    start?: { filter: string; date: string };
    end?: { filter: string; date: string };
  };
  hidden?: boolean;
}

export function getOptionFromFacet(
  facet: { key: string; count: number },
  label: string,
  selected: boolean,
  help?: string,
): OptionModel {
  return new OptionModel({
    id: facet.key,
    value: facet.key,
    label: `${label} (${facet.count})`,
    help,
    selected,
  });
}

export function formatFiltersFromFacets(allFacets: Search.FacetsResult, queryParamsFilters: string[] = []): Filters {
  // Group facets by types
  const facetGroups: {
    classification: { key: string; count: number }[];
    mainTypes: { key: string; count: number }[];
    languages: { key: string; count: number }[];
  } = Object.entries(allFacets).reduce(
    (groups, [facetId, values]) => {
      if (facetId.startsWith('/classification.labels/')) {
        Object.entries(values).forEach(([key, count]) => {
          groups.classification.push({ key, count });
        });
      } else if (facetId.startsWith('/icon/')) {
        Object.entries(values).forEach(([key, count]) => {
          groups.mainTypes.push({ key, count });
        });
      } else if (facetId.startsWith('/metadata.language')) {
        Object.entries(values).forEach(([key, count]) => {
          groups.languages.push({ key, count });
        });
      }
      return groups;
    },
    {
      classification: [] as { key: string; count: number }[],
      mainTypes: [] as { key: string; count: number }[],
      languages: [] as { key: string; count: number }[],
    },
  );

  // Create corresponding filter options
  const filters: Filters = {
    classification: [],
    mainTypes: [],
    languages: [],
    creation: {},
  };
  if (facetGroups.classification.length > 0) {
    facetGroups.classification.forEach((facet) => {
      const label = facet.key.split('/').slice(2).join('/');
      filters.classification.push(getOptionFromFacet(facet, label, queryParamsFilters.includes(facet.key)));
    });
    filters.classification.sort((a, b) => a.label.localeCompare(b.label));
  }
  if (facetGroups.mainTypes.length > 0) {
    facetGroups.mainTypes.forEach((facet) => {
      let help: string | undefined = facet.key.substring(5);
      let label = (mime as unknown as any).getExtension(help) || (facet.key.split('/').pop() as string);
      if (label === 'stf-link') {
        label = 'link';
      }
      if (help.includes('.')) {
        help = help.split('.').pop();
      }
      return filters.mainTypes.push(getOptionFromFacet(facet, label, queryParamsFilters.includes(facet.key), help));
    });
    filters.mainTypes.sort((a, b) => a.label.localeCompare(b.label));
  }
  if (facetGroups.languages.length > 0) {
    facetGroups.languages.forEach((facet) => {
      const language = facet.key.split('/').slice(2)[0];
      filters.languages?.push(getOptionFromFacet(facet, language, queryParamsFilters.includes(facet.key)));
    });
    filters.languages?.sort((a, b) => a.label.localeCompare(b.label));
  }
  const start = queryParamsFilters.find((param) => param.startsWith(CREATION_START_PREFIX));
  const end = queryParamsFilters.find((param) => param.startsWith(CREATION_END_PREFIX));
  filters.creation = {
    start: start ? { filter: start, date: getDateFromFilter(start) } : undefined,
    end: end ? { filter: end, date: getDateFromFilter(end) } : undefined,
  };
  const hidden = queryParamsFilters.find((param) => param.startsWith(HIDDEN_PREFIX));
  filters.hidden = hidden ? getVisibilityFromFilter(hidden) : undefined;

  return filters;
}
