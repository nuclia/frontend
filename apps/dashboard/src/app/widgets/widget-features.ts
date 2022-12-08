import { WidgetFeatures } from '@nuclia/core';

export const DEFAULT_FEATURES: WidgetFeatures = {
  editLabels: true,
  entityAnnotation: true,
  filter: true,
  navigateToLink: true,
  permalink: true,
  suggestions: true,
  notPublic: true,
};

export const DEFAULT_FEATURES_LIST = Object.entries(DEFAULT_FEATURES)
  .filter(([, value]) => value)
  .map(([key]) => key)
  .join(',');
