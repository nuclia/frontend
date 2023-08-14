import { WidgetFeatures } from '@nuclia/core';

export const DEFAULT_FEATURES: WidgetFeatures = {
  editLabels: false,
  entityAnnotation: false,
  filter: true,
  permalink: true,
  relations: true,
  suggestions: true,
  suggestEntities: false,
  notPublic: true,
  answers: false,
  onlyAnswers: false,
  hideSources: false,
  autofilter: false,
};

export const DEFAULT_FEATURES_LIST: string[] = Object.entries(DEFAULT_FEATURES)
  .filter(([, value]) => value)
  .map(([key]) => key);
