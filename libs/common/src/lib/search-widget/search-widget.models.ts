import { deepEqual } from '@flaps/core';

export type FilterType = 'labels' | 'entities' | 'created' | 'labelFamilies';
export type FilterSelectionType = { [key in FilterType]: boolean };
export const DEFAULT_FILTERS: FilterSelectionType = {
  labels: true,
  entities: true,
  created: false,
  labelFamilies: false,
};
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
  prependTheQuery: boolean;
  queryPrepend: string;
  rephraseQuery: boolean;
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
  askSpecificResource: boolean;
  specificResourceSlug: string;
  limitTokenConsumption: boolean;
  tokenConsumptionLimit: number | null;
  preferMarkdown: boolean;
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
  id: string;
  searchBox: SearchBoxConfig;
  generativeAnswer: GenerativeAnswerConfig;
  resultDisplay: ResultDisplayConfig;
}

export interface WidgetConfiguration {
  popupStyle: 'page' | 'popup';
  darkMode: 'light' | 'dark';
  hideLogo: boolean;
  permalink: boolean;
  navigateToLink: boolean;
  navigateToFile: boolean;
}

export interface Widget {
  slug: string;
  name: string;
  creationDate: string;
  searchConfigId: string;
  generativeModel: string;
  widgetConfig: WidgetConfiguration;
}

export const SAVED_CONFIG_KEY = 'NUCLIA_SELECTED_SEARCH_CONFIG';
export const SEARCH_CONFIGS_KEY = 'NUCLIA_SEARCH_CONFIGS';
export const SAVED_WIDGETS_KEY = 'NUCLIA_SAVED_WIDGETS';

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
  prependTheQuery: false,
  queryPrepend: '',
  rephraseQuery: false,
};
export const DEFAULT_GENERATIVE_ANSWER_CONFIG: GenerativeAnswerConfig = {
  generateAnswer: false,
  generativeModel: '',
  usePrompt: false,
  prompt: '',
  customizeNotEnoughDataMessage: false,
  notEnoughDataMessage: '',
  generateAnswerWith: 'semantic-and-full-text',
  askSpecificResource: false,
  specificResourceSlug: '',
  limitTokenConsumption: false,
  tokenConsumptionLimit: null,
  preferMarkdown: false,
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
export const DEFAULT_WIDGET_CONFIG: WidgetConfiguration = {
  popupStyle: 'page',
  darkMode: 'light',
  hideLogo: false,
  permalink: false,
  navigateToLink: false,
  navigateToFile: false,
};

export const NUCLIA_STANDARD_SEARCH_CONFIG: SearchConfiguration = {
  id: 'nuclia-standard',
  searchBox: {
    ...DEFAULT_SEARCH_BOX_CONFIG,
    suggestions: true,
    autocompleteFromNERs: true,
  },
  generativeAnswer: {
    ...DEFAULT_GENERATIVE_ANSWER_CONFIG,
    generateAnswer: true,
  },
  resultDisplay: {
    ...DEFAULT_RESULT_DISPLAY_CONFIG,
    displayResults: true,
    relations: true,
  },
};

export function isSameConfigurations(configA: SearchConfiguration, configB: SearchConfiguration): boolean {
  return deepEqual(configA, configB);
}

export function getFeatures(config: SearchConfiguration, widgetOptions: WidgetConfiguration): string {
  const widgetFeatures = {
    // Search configuration
    answers: config.generativeAnswer.generateAnswer,
    preferMarkdown: config.generativeAnswer.generateAnswer && config.generativeAnswer.preferMarkdown,
    noBM25forChat: config.generativeAnswer.generateAnswerWith === 'only-semantic',
    rephrase: config.searchBox.rephraseQuery,
    filter: config.searchBox.filter,
    autofilter: config.searchBox.autofilter,
    useSynonyms: config.searchBox.useSynonyms,
    suggestions: config.searchBox.suggestions,
    suggestLabels: config.searchBox.suggestLabels,
    autocompleteFromNERs: config.searchBox.suggestions && config.searchBox.autocompleteFromNERs,
    citations: config.resultDisplay.displayResults && config.resultDisplay.showResultType === 'citations',
    hideResults: !config.resultDisplay.displayResults || config.resultDisplay.showResultType === 'citations',
    displayMetadata: config.resultDisplay.displayMetadata,
    hideThumbnails: !config.resultDisplay.displayThumbnails,
    relations: config.resultDisplay.relations,
    knowledgeGraph: config.resultDisplay.relationGraph,
    displayFieldList: config.resultDisplay.displayFieldList,

    // Widget options
    hideLogo: widgetOptions.hideLogo,
    permalink: widgetOptions.permalink,
    navigateToLink: widgetOptions.navigateToLink,
    navigateToFile: widgetOptions.navigateToFile,
  };
  const featureList = Object.entries(widgetFeatures)
    .filter(([, enabled]) => enabled)
    .map(([feature]) => feature)
    .join(',');

  return `\n  features="${featureList}"`;
}
export function getPlaceholder(config: SearchBoxConfig): string {
  return config.customizePlaceholder && config.placeholder ? `\n  placeholder="${config.placeholder}"` : '';
}
export function getPrompt(config: GenerativeAnswerConfig): string {
  if (config.usePrompt && !!config.prompt.trim()) {
    const prompt = config.prompt.trim().replace(/"/g, '&quot;').replace(/\n/g, '&#10;');
    return `\n  prompt="${prompt}"`;
  }
  return '';
}
export function getFilters(config: SearchBoxConfig): string {
  if (!config.filter) {
    return '';
  }
  const value = Object.entries(config.filters)
    .filter(([, value]) => value)
    .map(([key]) => key)
    .join(',');
  return `\n  filters="${value}"`;
}
export function getPreselectedFilters(config: SearchBoxConfig): string {
  const value = config.preselectedFilters
    .split('\n')
    .map((filter) => {
      let formattedFilter = filter.trim();
      try {
        formattedFilter = JSON.stringify(JSON.parse(formattedFilter));
      } catch (e) {
        // do nothing more if the filter wasn't in JSON format
      }
      return formattedFilter;
    })
    .join(',');
  const quote = value.includes('"') ? `'` : `"`;
  return config.setPreselectedFilters && value ? `\n  preselected_filters=${quote}${value}${quote}` : '';
}
export function getRagStrategies(ragStrategiesConfig: RagStrategiesConfig) {
  const ragStrategies: string[] = [];
  if (ragStrategiesConfig.entireResourceAsContext) {
    ragStrategies.push(`full_resource|${ragStrategiesConfig.maxNumberOfResources || 5}`);
  } else {
    if (ragStrategiesConfig.fieldsAsContext && ragStrategiesConfig.fieldIds) {
      const fieldIds = ragStrategiesConfig.fieldIds
        .split(`\n`)
        .map((id) => id.trim())
        .join('|');
      ragStrategies.push(`field_extension|${fieldIds}`);
    }
    if (ragStrategiesConfig.includeTextualHierarchy) {
      ragStrategies.push(`hierarchy|${ragStrategiesConfig.additionalCharacters || 1000}`);
    }
  }
  const ragImagesStrategies: string[] = [];
  if (ragStrategiesConfig.includePageImages) {
    ragImagesStrategies.push(`page_image|${ragStrategiesConfig.maxNumberOfImages || 2}`);
  }
  if (ragStrategiesConfig.includeParagraphImages) {
    ragImagesStrategies.push('paragraph_image');
  }

  const ragProperties = ragStrategies.length > 0 ? `\n  rag_strategies="${ragStrategies.join(',')}"` : '';
  const ragImagesProperties =
    ragImagesStrategies.length > 0 ? `\n  rag_images_strategies="${ragImagesStrategies.join(',')}"` : '';

  return { ragProperties, ragImagesProperties };
}
export function getNotEnoughDataMessage(config: GenerativeAnswerConfig): string {
  return config.customizeNotEnoughDataMessage && !!config.notEnoughDataMessage.trim()
    ? `\n  not_enough_data_message="${config.notEnoughDataMessage.trim().replace(/"/g, '&quot;')}"`
    : '';
}
export function getAskToResource(config: GenerativeAnswerConfig): string {
  return config.askSpecificResource && !!config.specificResourceSlug.trim()
    ? `\n  ask_to_resource="${config.specificResourceSlug.trim()}"`
    : '';
}
export function getMaxTokens(config: GenerativeAnswerConfig): string {
  return config.limitTokenConsumption && !!config.tokenConsumptionLimit
    ? `\n  max_tokens="${config.tokenConsumptionLimit}"`
    : '';
}
export function getQueryPrepend(config: SearchBoxConfig): string {
  return config.prependTheQuery && !!config.queryPrepend.trim() ? `\n  query_prepend="${config.queryPrepend}"` : '';
}

export function getWidgetTheme(options: WidgetConfiguration): string {
  return options.darkMode === 'dark' ? `\n  mode="dark"` : '';
}
