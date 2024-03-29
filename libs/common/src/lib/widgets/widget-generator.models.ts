import { CopilotData } from './copilot/copilot-modal.component';
import { RAGImageStrategy, RAGStrategy } from '@nuclia/core';

export type PresetType = 'search' | 'find' | 'ask' | 'discover';
export type FilterType = 'labels' | 'entities' | 'created' | 'labelFamilies';
export type FilterSelectionType = { [key in FilterType]: boolean };
export type PresetAccordionType = 'preset' | 'location' | 'answerOutput' | 'copilot' | '';
export type PresetForm = {
  location: 'public' | 'application' | null;
  preset: PresetType | null;
  answerOutput: 'onlyAnswers' | 'answerAndResults' | null;
};
export type AdvancedForm = {
  answers: boolean;
  userPrompt: string;
  citations: boolean;
  hideResults: boolean;
  rephrase: boolean;
  noBM25forChat: boolean;
  filter: boolean;
  autofilter: boolean;
  placeholder: string;
  preselectedFilters: string;
  ragSpecificFieldIds: string;
  useSynonyms: boolean;
  suggestions: boolean;
  suggestLabels: boolean;
  permalink: boolean;
  navigateToLink: boolean;
  navigateToFile: boolean;
  displayMetadata: boolean;
  hideThumbnails: boolean;
  darkMode: boolean;
  hideLogo: boolean;
  autocompleteFromNERs: boolean;
  relations: boolean;
  knowledgeGraph: boolean;
  notEnoughDataMessage: string;
  generativeModelToggle: boolean;
  generativeModel: string;
};
export type WidgetConfiguration = {
  features?: AdvancedForm;
  placeholder?: string;
  filters?: { [key in FilterType]: boolean };
  preset?: PresetForm;
  copilotData?: CopilotData;
  rag_strategies?: RAGStrategy[];
  rag_images_strategies?: RAGImageStrategy[];
  notEnoughDataMessage?: string;
};
export const WIDGETS_CONFIGURATION = 'NUCLIA_WIDGETS_CONFIGURATION';
export const DEFAULT_FILTERS: FilterSelectionType = {
  labels: true,
  entities: true,
  created: false,
  labelFamilies: false,
};
// WARNING: for isModifiedConfig function to work properly, the properties in DEFAULT_CONFIGURATION must be
// in the EXACT SAME order as the properties declared in advancedForm in widget generator page
export const DEFAULT_CONFIGURATION: AdvancedForm = {
  answers: false,
  userPrompt: '',
  citations: false,
  hideResults: false,
  rephrase: false,
  noBM25forChat: false,
  ragSpecificFieldIds: '',
  filter: false,
  autofilter: false,
  preselectedFilters: '',
  useSynonyms: false,
  suggestions: false,
  suggestLabels: false,
  permalink: false,
  navigateToLink: false,
  navigateToFile: false,
  placeholder: '',
  displayMetadata: false,
  hideThumbnails: false,
  darkMode: false,
  hideLogo: false,
  autocompleteFromNERs: false,
  relations: false,
  knowledgeGraph: false,
  notEnoughDataMessage: '',
  generativeModelToggle: false,
  generativeModel: '',
};

export function getSearchPresetConfig(value: Partial<PresetForm>): AdvancedForm {
  return {
    ...DEFAULT_CONFIGURATION,
    filter: true,
    suggestions: true,
    permalink: true,
    navigateToFile: value.location === 'public',
    navigateToLink: value.location === 'public',
    displayMetadata: true,
  };
}

export function getFindPresetConfig(value: Partial<PresetForm>): AdvancedForm {
  return {
    ...DEFAULT_CONFIGURATION,
    filter: true,
    autofilter: true,
    useSynonyms: true,
    permalink: true,
    navigateToFile: value.location === 'public',
    navigateToLink: value.location === 'public',
    hideThumbnails: true,
    autocompleteFromNERs: true,
  };
}

export function getAskPresetConfig(value: Partial<PresetForm>): AdvancedForm {
  return {
    ...DEFAULT_CONFIGURATION,
    answers: true,
    hideResults: value.answerOutput === 'onlyAnswers',
    rephrase: true,
    permalink: true,
    navigateToFile: value.answerOutput === 'answerAndResults' && value.location === 'public',
    navigateToLink: value.answerOutput === 'answerAndResults' && value.location === 'public',
    hideThumbnails: true,
    autocompleteFromNERs: true,
    relations: true,
  };
}

export function getDiscoverConfig(): AdvancedForm {
  return {
    ...DEFAULT_CONFIGURATION,
    autofilter: true,
    suggestions: true,
    permalink: true,
    displayMetadata: true,
    hideThumbnails: true,
    autocompleteFromNERs: true,
    relations: true,
    knowledgeGraph: true,
  };
}

export function isModifiedConfig(currentConfig: AdvancedForm, presetConfig: AdvancedForm): boolean {
  return JSON.stringify(currentConfig) !== JSON.stringify(presetConfig);
}
