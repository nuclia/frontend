import type { Classification } from '../resource';

export function getFilterFromLabel(label: Classification) {
  // TEMPORARY, filter does not work on paragraphs if we put the prefixing /
  return `l/${label.labelset}/${label.label}`;
  // return `/l/${label.labelset}/${label.label}`;
}

export function getLabelFromFilter(filter: string): Classification {
  const items = filter.split('/');
  // TEMPORARY, filter does not work on paragraphs if we put the prefixing /
  return { labelset: items[1], label: items[2] };
  // return { labelset: items[2], label: items[3] };
}
