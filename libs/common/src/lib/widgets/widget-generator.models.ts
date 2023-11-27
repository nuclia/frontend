export type FilterType = 'labels' | 'entities' | 'created' | 'labelFamilies';

export type AdvancedForm = {
  answers: boolean;
  userPrompt: string;
  hideSources: boolean;
  onlyAnswers: boolean;
  noBM25forChat: boolean;
  filter: boolean;
  autofilter: boolean;
  preselectedFilters: string;
  useSynonyms: boolean;
  suggestions: boolean;
  suggestLabels: boolean;
  permalink: boolean;
  navigateToLink: boolean;
  navigateToFile: boolean;
  targetNewTab: boolean;
  displayMetadata: boolean;
  hideThumbnails: boolean;
  darkMode: boolean;
  hideLogo: boolean;
  autocompleteFromNERs: boolean;
  relations: boolean;
  knowledgeGraph: boolean;
};
export type WidgetConfiguration = {
  features?: AdvancedForm;
  placeholder?: string;
  filters?: { [key in FilterType]: boolean };
};
export const WIDGETS_CONFIGURATION = 'NUCLIA_WIDGETS_CONFIGURATION';
