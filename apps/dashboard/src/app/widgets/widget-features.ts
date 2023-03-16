import { WidgetFeatures } from '@nuclia/core';

export const DEFAULT_FEATURES: WidgetFeatures = {
  editLabels: false,
  entityAnnotation: false,
  filter: true,
  permalink: true,
  relations: true,
  suggestions: true,
  notPublic: true,
  answers: true,
};

export const DEFAULT_FEATURES_LIST = Object.entries(DEFAULT_FEATURES)
  .filter(([, value]) => value)
  .map(([key]) => key)
  .join(',');
