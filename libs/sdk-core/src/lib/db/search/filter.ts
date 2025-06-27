import type { LabelSets } from '../kb';
import type { Classification } from '../resource';

export const LABEL_FILTER_PREFIX = 'classification.labels';
export const NER_FILTER_PREFIX = 'entities';
export const MIME_FILTER_PREFIX = 'icon';

export const MIME_FACETS = [
  '/icon/application',
  '/icon/audio',
  '/icon/image',
  '/icon/text',
  '/icon/video',
  '/icon/message',
];
export const LANGUAGE_FACET = ['/metadata.language'];
export const MAX_FACETS_PER_REQUEST = 50;

export const CREATION_START_PREFIX = '/creation/start/';
export const CREATION_END_PREFIX = '/creation/end/';
export const HIDDEN_PREFIX = '/hidden/';

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
export function getDateFromFilter(dateFilter: string) {
  return dateFilter.split('/').slice(-1)[0];
}
export function getFilterFromDate(date: string, type: 'start' | 'end') {
  return `${type === 'start' ? CREATION_START_PREFIX : CREATION_END_PREFIX}${date}`;
}

export function getVisibilityFromFilter(filter: string) {
  return filter.split('/').slice(-1)[0] === 'true';
}

export function getFilterFromVisibility(hidden: boolean) {
  return `${HIDDEN_PREFIX}/${hidden ? 'true' : 'false'}`;
}

export function trimLabelSets(labelSets: LabelSets, classifications: Classification[]) {
  return Object.entries(labelSets)
    .map(([key, value]) => {
      const labelSet = {
        ...value,
        labels: value.labels.filter((label) =>
          classifications.some(
            (classification) => classification.labelset === key && classification.label === label.title,
          ),
        ),
      };
      return { key, labelSet };
    })
    .filter(({ labelSet }) => labelSet.labels.length > 0)
    .reduce((acc, { key, labelSet }) => {
      acc[key] = labelSet;
      return acc;
    }, {} as LabelSets);
}
