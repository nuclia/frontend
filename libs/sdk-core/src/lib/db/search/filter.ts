import type { Classification } from '../resource';

export const LABEL_FILTER_PREFIX = 'classification.labels';
export const NER_FILTER_PREFIX = 'entities';

export function getFilterFromLabel(label: Classification) {
  return `/${LABEL_FILTER_PREFIX}/${label.labelset}/${label.label}`;
}

export function getLabelFromFilter(filter: string): Classification {
  const items = filter.split('/');
  return { labelset: items[2], label: items[3] };
}

export function getFilterFromLabelSet(labelSet: string) {
  return `/${LABEL_FILTER_PREFIX}/${labelSet}`;
}

export function getLabelSetFromFilter(filter: string): string {
  return filter.split('/')[2];
}

export function getFilterFromEntity(entity: { family: string; entity: string }) {
  return `/${NER_FILTER_PREFIX}/${entity.family}/${entity.entity}`;
}

export function getEntityFromFilter(filter: string): { family: string; entity: string } {
  const items = filter.split('/');
  return { family: items[2], entity: items[3] };
}
