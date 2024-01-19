import { WidgetFeatures } from '@nuclia/core';

// TODO to be refactored, we probably want our search page to use presets instead of this default set of features manually updated

export const DEFAULT_FEATURES: WidgetFeatures = {
  editLabels: false,
  entityAnnotation: false,
  filter: true,
  permalink: true,
  relations: true,
  suggestions: true,
  autocompleteFromNERs: false,
  notPublic: true,
  answers: false,
  hideResults: false,
  autofilter: false,
  noBM25forChat: false,
  hideLogo: false,
  knowledgeGraph: false,
};

export const DEFAULT_FEATURES_LIST: string[] = Object.entries(DEFAULT_FEATURES)
  .filter(([, value]) => value)
  .map(([key]) => key);
