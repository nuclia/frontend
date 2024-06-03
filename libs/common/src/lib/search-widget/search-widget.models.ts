import { DEFAULT_FILTERS, FilterSelectionType } from './widgets';

export const MODELS_SUPPORTING_VISION = ['chatgpt-vision', 'gemini-1-5-pro-vision'];

export interface SearchBoxConfig {
  customizePlaceholder: boolean;
  filter: boolean;
  autofilter: boolean;
  setPreselectedFilters: boolean;
  suggestions: boolean;
  useSynonyms: boolean;
  suggestResults: boolean;
  suggestLabels: boolean;
  autocompleteFromNERs: boolean;
  placeholder: string;
  preselectedFilters: string;
  filters: FilterSelectionType;
}
export interface RagStrategiesConfig {
  includeTextualHierarchy: boolean;
  additionalCharacters: number | null;
  entireResourceAsContext: boolean;
  maxNumberOfResources: number | null;
  fieldsAsContext: boolean;
  fieldIds: string;
  includePageImages: boolean;
  maxNumberOfImages: number | null;
  includeParagraphImages: boolean;
}
export interface GenerativeAnswerConfig {
  generateAnswer: boolean;
  generativeModel: string;
  usePrompt: boolean;
  prompt: string;
  customizeNotEnoughDataMessage: boolean;
  notEnoughDataMessage: string;
  generateAnswerWith: 'only-semantic' | 'semantic-and-full-text';
  rephraseQuery: boolean;
  askSpecificResource: boolean;
  specificResourceSlug: string;
  limitTokenConsumption: boolean;
  tokenConsumptionLimit: number | null;
  ragStrategies: RagStrategiesConfig;
}

export interface ResultDisplayConfig {
  displayResults: boolean;
  showResultType: 'citations' | 'all-resources';
  displayMetadata: boolean;
  displayThumbnails: boolean;
  displayFieldList: boolean;
  relations: boolean;
  relationGraph: boolean;
}

export interface SearchConfiguration {
  searchBox: SearchBoxConfig;
  generativeAnswer: GenerativeAnswerConfig;
  resultDisplay: ResultDisplayConfig;
}

export const DEFAULT_SEARCH_BOX_CONFIG: SearchBoxConfig = {
  customizePlaceholder: false,
  placeholder: '',
  filter: false,
  filters: DEFAULT_FILTERS,
  autofilter: false,
  setPreselectedFilters: false,
  preselectedFilters: '',
  suggestions: false,
  suggestResults: false,
  suggestLabels: false,
  autocompleteFromNERs: false,
  useSynonyms: false,
};
export const DEFAULT_GENERATIVE_ANSWER_CONFIG: GenerativeAnswerConfig = {
  generateAnswer: false,
  generativeModel: '',
  usePrompt: false,
  prompt: '',
  customizeNotEnoughDataMessage: false,
  notEnoughDataMessage: '',
  generateAnswerWith: 'semantic-and-full-text',
  rephraseQuery: false,
  askSpecificResource: false,
  specificResourceSlug: '',
  limitTokenConsumption: false,
  tokenConsumptionLimit: null,
  ragStrategies: {
    includeTextualHierarchy: false,
    additionalCharacters: null,
    entireResourceAsContext: false,
    maxNumberOfResources: null,
    fieldsAsContext: false,
    fieldIds: '',
    includePageImages: false,
    maxNumberOfImages: null,
    includeParagraphImages: false,
  },
};
export const DEFAULT_RESULT_DISPLAY_CONFIG: ResultDisplayConfig = {
  displayResults: false,
  showResultType: 'all-resources',
  displayMetadata: false,
  displayThumbnails: false,
  displayFieldList: false,
  relations: false,
  relationGraph: false,
};
