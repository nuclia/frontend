import type { Search } from '@nuclia/core';
import mime from 'mime';
import { SvelteState } from '../state-lib';

interface MimeState {
  mimeFacets: Search.FacetsResult;
}

export interface MimeFacet {
  label: string;
  facet: { key: string; count: number };
}
export interface MimeFilter {
  label: string;
  key: string;
}

export const mimeFacetsState = new SvelteState<MimeState>({
  mimeFacets: {},
});

export const mimeFacets = mimeFacetsState.writer<Search.FacetsResult>(
  (state) => state.mimeFacets,
  (state, mimeFacets) => ({
    ...state,
    mimeFacets,
  }),
);

export const orderedMimeFacetsList = mimeFacetsState.reader<MimeFacet[]>((state) =>
  Object.entries(state.mimeFacets)
    .filter(([, facets]) => Object.keys(facets).length > 0)
    .reduce((list, [, facets]) => {
      Object.entries(facets)
        .filter(([, count]) => count > 0)
        .forEach(([key, count]) => {
          list.push({ label: getMimeLabelFromKey(key), facet: { key, count } });
        });
      return list;
    }, [] as MimeFacet[])
    .sort((mimeA, mimeB) => mimeA.label.localeCompare(mimeB.label)),
);

export function getMimeFromFilter(filter: string): MimeFilter {
  return {
    key: filter,
    label: getMimeLabelFromKey(filter),
  };
}

function getMimeLabelFromKey(key: string): string {
  // Mime type facets all starts with /icon/
  const mimeType = key.substring(5);
  let label = (mime as unknown as any).getExtension(mimeType) || (key.split('/').pop() as string);
  if (label === 'stf-link') {
    label = 'link';
  }
  return label;
}
