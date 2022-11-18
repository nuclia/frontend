import type { Classification } from '../resource';

export function getFilterFromLabel(label: Classification) {
  return `/l/${label.labelset}/${label.label}`;
}

export function getLabelFromFilter(filter: string): Classification {
  const items = filter.split('/');
  return { labelset: items[2], label: items[3] };
}
