import { OptionModel } from '@guillotinaweb/pastanaga-angular';
import { Search } from '@nuclia/core';
import mime from 'mime';

export const MIME_FACETS = ['/icon/application', '/icon/audio', '/icon/image', '/icon/text', '/icon/video'];
export const LANGUAGE_FACET = ['/metadata.language'];

export interface Filters {
  classification: OptionModel[];
  mainTypes: OptionModel[];
  languages?: OptionModel[];
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
      let label = mime.getExtension(help) || (facet.key.split('/').pop() as string);
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

  return filters;
}
