import type { Classification } from '../resource';

export function getFilterFromLabel(label: Classification) {
  return `/classification.labels/${label.labelset}/${label.label}`;
}

export function getLabelFromFilter(filter: string): Classification {
  const items = filter.split('/');
  return { labelset: items[2], label: items[3] };
}

export function getFilterFromLabelSet(labelSet: string) {
  return `/classification.labels/${labelSet}`;
}

export function getLabelSetFromFilter(filter: string): string {
  return filter.split('/')[2];
}

export function getFilterFromEntity(entity: { family: string; entity: string }) {
  return `/entities/${entity.family}/${entity.entity}`;
}

export function getEntityFromFilter(filter: string): { family: string; entity: string } {
  const items = filter.split('/');
  return { family: items[2], entity: items[3] };
}
