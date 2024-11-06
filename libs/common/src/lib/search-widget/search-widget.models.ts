import { deepEqual } from '@flaps/core';
import { RAG_METADATAS, RagStrategyName } from '@nuclia/core';

export type FilterType = 'labels' | 'entities' | 'created' | 'labelFamilies';
export type FilterSelectionType = { [key in FilterType]: boolean };
export const DEFAULT_FILTERS: FilterSelectionType = {
  labels: true,
  entities: false,
  created: false,
  labelFamilies: false,
};
export const INITIAL_CITATION_THRESHOLD = 0.7;
export const MODELS_SUPPORTING_VISION = ['chatgpt-vision', 'gemini-1-5-pro-vision'];

export interface SearchBoxConfig {
  filter: boolean;
  filterLogic: 'and' | 'or';
  autofilter: boolean;
  setPreselectedFilters: boolean;
  suggestions: boolean;
  useSynonyms: boolean;
  suggestResults: boolean;
  autocompleteFromNERs: boolean;
  preselectedFilters: string;
  filters: FilterSelectionType;
  prependTheQuery: boolean;
  queryPrepend: string;
  rephraseQuery: boolean;
  useRephrasePrompt: boolean;
  rephrasePrompt: string;
  generateAnswerWith: 'only-semantic' | 'semantic-and-full-text';
  showHiddenResources: boolean;
  semanticReranking: boolean;
  vectorset: string; // aka semantic model
}
export interface RagStrategiesConfig {
  includeTextualHierarchy: boolean;
  additionalCharacters: number | null;
  metadatasRagStrategy: boolean;
  metadatas: { [key in RAG_METADATAS]: boolean } | undefined;
  includeNeighbouringParagraphs: boolean;
  precedingParagraphs: number | null;
  succeedingParagraphs: number | null;
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
  useSystemPrompt: boolean;
  systemPrompt: string;
  askSpecificResource: boolean;
  specificResourceSlug: string;
  limitTokenConsumption: boolean;
  tokenConsumptionLimit: number | null;
  outputTokenConsumptionLimit: number | null;
  limitParagraphs: boolean;
  paragraphsLimit: number | null;
  preferMarkdown: boolean;
  ragStrategies: RagStrategiesConfig;
}

export interface ResultDisplayConfig {
  displayResults: boolean;
  showResultType: 'citations' | 'all-resources';
  displayMetadata: boolean;
  displayThumbnails: boolean;
  showAttachedImages: boolean;
  displayFieldList: boolean;
  relations: boolean;
  relationGraph: boolean;
  jsonOutput: boolean;
  jsonSchema: string;
  customizeThreshold: boolean;
  citationThreshold: number;
}

export interface SearchConfiguration {
  id: string;
  searchBox: SearchBoxConfig;
  generativeAnswer: GenerativeAnswerConfig;
  resultDisplay: ResultDisplayConfig;
}

export interface WidgetConfiguration {
  widgetMode: 'page' | 'popup' | 'chat';
  darkMode: 'light' | 'dark';
  customizePlaceholder: boolean;
  placeholder: string;
  customizeChatPlaceholder: boolean;
  chatPlaceholder: string;
  customizeNotEnoughDataMessage: boolean;
  notEnoughDataMessage: string;
  hideLogo: boolean;
  permalink: boolean;
  navigateToLink: boolean;
  navigateToFile: boolean;
  openNewTab: boolean;
  noChatHistory: boolean;
  speech: boolean;
  speechSynthesis: boolean;
}

export interface Widget {
  slug: string;
  name: string;
  creationDate: string;
  searchConfigId: string;
  generativeModel: string;
  vectorset: string;
  widgetConfig: WidgetConfiguration;
}

export interface SearchAndWidgets {
  searchConfigurations?: SearchConfiguration[];
  widgets?: Widget[];
  ragLabQuestions?: string[];
}

export const SAVED_CONFIG_KEY = 'NUCLIA_SELECTED_SEARCH_CONFIG';

export const DEFAULT_SEARCH_BOX_CONFIG: SearchBoxConfig = {
  filter: false,
  filters: DEFAULT_FILTERS,
  filterLogic: 'and',
  autofilter: false,
  setPreselectedFilters: false,
  preselectedFilters: '',
  suggestions: false,
  suggestResults: false,
  autocompleteFromNERs: false,
  useSynonyms: false,
  prependTheQuery: false,
  queryPrepend: '',
  rephraseQuery: true,
  useRephrasePrompt: false,
  rephrasePrompt: '',
  generateAnswerWith: 'semantic-and-full-text',
  showHiddenResources: false,
  semanticReranking: true,
  vectorset: '',
};
export const DEFAULT_GENERATIVE_ANSWER_CONFIG: GenerativeAnswerConfig = {
  generateAnswer: false,
  generativeModel: '',
  usePrompt: false,
  prompt: '',
  useSystemPrompt: false,
  systemPrompt: '',
  askSpecificResource: false,
  specificResourceSlug: '',
  limitTokenConsumption: false,
  tokenConsumptionLimit: null,
  outputTokenConsumptionLimit: null,
  limitParagraphs: false,
  paragraphsLimit: null,
  preferMarkdown: false,
  ragStrategies: {
    includeTextualHierarchy: false,
    additionalCharacters: null,
    metadatasRagStrategy: false,
    metadatas: {
      origin: false,
      classification_labels: false,
      ners: false,
      extra_metadata: false,
    },
    includeNeighbouringParagraphs: true,
    precedingParagraphs: 2,
    succeedingParagraphs: 2,
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
  showResultType: 'citations',
  displayMetadata: false,
  displayThumbnails: true,
  showAttachedImages: false,
  displayFieldList: false,
  relations: false,
  relationGraph: false,
  jsonOutput: false,
  jsonSchema: '',
  customizeThreshold: false,
  citationThreshold: INITIAL_CITATION_THRESHOLD,
};
export const DEFAULT_WIDGET_CONFIG: WidgetConfiguration = {
  widgetMode: 'page',
  darkMode: 'light',
  customizePlaceholder: false,
  placeholder: '',
  customizeChatPlaceholder: false,
  chatPlaceholder: '',
  customizeNotEnoughDataMessage: false,
  notEnoughDataMessage: '',
  hideLogo: false,
  permalink: false,
  navigateToLink: false,
  navigateToFile: false,
  openNewTab: false,
  noChatHistory: false,
  speech: false,
  speechSynthesis: false,
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
    noBM25forChat: config.searchBox.generateAnswerWith === 'only-semantic',
    rephrase: config.searchBox.rephraseQuery,
    filter: config.searchBox.filter,
    orFilterLogic: config.searchBox.filter && config.searchBox.filterLogic === 'or',
    autofilter: config.searchBox.autofilter,
    useSynonyms: config.searchBox.useSynonyms,
    suggestions: config.searchBox.suggestions,
    autocompleteFromNERs: config.searchBox.suggestions && config.searchBox.autocompleteFromNERs,
    showHidden: config.searchBox.showHiddenResources,
    citations: config.resultDisplay.displayResults && config.resultDisplay.showResultType === 'citations',
    hideResults: !config.resultDisplay.displayResults || config.resultDisplay.showResultType === 'citations',
    displayMetadata: config.resultDisplay.displayMetadata,
    hideThumbnails: !config.resultDisplay.displayThumbnails,
    showAttachedImages: config.resultDisplay.showAttachedImages,
    relations: config.resultDisplay.relations,
    knowledgeGraph: config.resultDisplay.relationGraph,
    displayFieldList: config.resultDisplay.displayFieldList,

    // Widget options
    hideLogo: widgetOptions.hideLogo,
    permalink: widgetOptions.permalink,
    navigateToLink: widgetOptions.navigateToLink,
    navigateToFile: widgetOptions.navigateToFile,
    openNewTab: (widgetOptions.navigateToLink || widgetOptions.navigateToFile) && widgetOptions.openNewTab,
    noChatHistory: widgetOptions.noChatHistory,
    speech: widgetOptions.speech,
    speechSynthesis: widgetOptions.speechSynthesis,
  };
  const featureList = Object.entries(widgetFeatures)
    .filter(([, enabled]) => enabled)
    .map(([feature]) => feature)
    .join(',');

  return `\n  features="${featureList}"`;
}
export function getPlaceholder(config: WidgetConfiguration): string {
  return config.customizePlaceholder && config.placeholder ? `\n  placeholder="${config.placeholder}"` : '';
}
export function getChatPlaceholder(config: WidgetConfiguration): string {
  return config.customizeChatPlaceholder && config.chatPlaceholder
    ? `\n  chat_placeholder="${config.chatPlaceholder}"`
    : '';
}
export function getPrompt(config: GenerativeAnswerConfig): string {
  if (config.usePrompt && !!config.prompt.trim()) {
    return `\n  prompt="${escapePrompt(config.prompt)}"`;
  }
  return '';
}
export function getSystemPrompt(config: GenerativeAnswerConfig): string {
  if (config.useSystemPrompt && !!config.systemPrompt.trim()) {
    return `\n  system_prompt="${escapePrompt(config.systemPrompt)}"`;
  }
  return '';
}
export function getRephrasePrompt(config: SearchBoxConfig): string {
  if (config.rephraseQuery && config.useRephrasePrompt && !!config.rephrasePrompt.trim()) {
    return `\n  rephrase_prompt="${escapePrompt(config.rephrasePrompt)}"`;
  }
  return '';
}
function escapePrompt(prompt: string) {
  return prompt.trim().replace(/"/g, '&quot;').replace(/\n/g, '&#10;');
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

export function getPreselectedFilterList(config: SearchBoxConfig): string[] {
  return config.preselectedFilters.split('\n').map((filter) => {
    let formattedFilter = filter.trim();
    try {
      formattedFilter = JSON.stringify(JSON.parse(formattedFilter));
    } catch (e) {
      // do nothing more if the filter wasn't in JSON format
    }
    return formattedFilter;
  });
}

export function getPreselectedFilters(config: SearchBoxConfig): string {
  const value = getPreselectedFilterList(config).join(',');
  const quote = value.includes('"') ? `'` : `"`;
  return config.setPreselectedFilters && value ? `\n  preselected_filters=${quote}${value}${quote}` : '';
}

export function getRagStrategies(ragStrategiesConfig: RagStrategiesConfig) {
  const ragStrategies: string[] = [];
  if (ragStrategiesConfig.entireResourceAsContext) {
    ragStrategies.push(`${RagStrategyName.FULL_RESOURCE}|${ragStrategiesConfig.maxNumberOfResources || 5}`);
  } else {
    if (ragStrategiesConfig.fieldsAsContext && ragStrategiesConfig.fieldIds) {
      const fieldIds = ragStrategiesConfig.fieldIds
        .split(`\n`)
        .map((id) => id.trim())
        .join('|');
      ragStrategies.push(`${RagStrategyName.FIELD_EXTENSION}|${fieldIds}`);
    }
    if (ragStrategiesConfig.includeTextualHierarchy) {
      ragStrategies.push(`${RagStrategyName.HIERARCHY}|${ragStrategiesConfig.additionalCharacters || 1000}`);
    } else if (ragStrategiesConfig.includeNeighbouringParagraphs) {
      const preceding =
        typeof ragStrategiesConfig.precedingParagraphs === 'number' ? ragStrategiesConfig.precedingParagraphs : 2;
      const succeeding =
        typeof ragStrategiesConfig.succeedingParagraphs === 'number' ? ragStrategiesConfig.succeedingParagraphs : 2;
      ragStrategies.push(`${RagStrategyName.NEIGHBOURING_PARAGRAPHS}|${preceding}|${succeeding}`);
    }
  }
  if (ragStrategiesConfig.metadatasRagStrategy && ragStrategiesConfig.metadatas) {
    const metadatas = Object.entries(ragStrategiesConfig.metadatas)
      .filter(([, value]) => value)
      .map(([key]) => key);
    if (metadatas.length > 0) {
      ragStrategies.push(`${RagStrategyName.METADATAS}|${metadatas.join('|')}`);
    }
  }
  const ragImagesStrategies: string[] = [];
  if (ragStrategiesConfig.includePageImages) {
    ragImagesStrategies.push(`page_image|${ragStrategiesConfig.maxNumberOfImages || 2}`);
  }
  if (ragStrategiesConfig.includeParagraphImages) {
    ragImagesStrategies.push('paragraph_image');
  }

  return {
    ragStrategies: ragStrategies.join(','),
    ragImagesStrategies: ragImagesStrategies.join(','),
  };
}
export function getRagStrategiesProperties(ragStrategiesConfig: RagStrategiesConfig) {
  const { ragStrategies, ragImagesStrategies } = getRagStrategies(ragStrategiesConfig);
  const ragProperties = ragStrategies.length > 0 ? `\n  rag_strategies="${ragStrategies}"` : '';
  const ragImagesProperties =
    ragImagesStrategies.length > 0 ? `\n  rag_images_strategies="${ragImagesStrategies}"` : '';

  return { ragProperties, ragImagesProperties };
}
export function getNotEnoughDataMessage(config: WidgetConfiguration): string {
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
  if (!config.limitTokenConsumption) {
    return '';
  }
  let code = '';
  if (!!config.tokenConsumptionLimit) {
    code += `\n  max_tokens="${config.tokenConsumptionLimit}"`;
  }
  if (!!config.outputTokenConsumptionLimit) {
    code += `\n  max_output_tokens="${config.outputTokenConsumptionLimit}"`;
  }
  return code;
}
export function getMaxParagraphs(config: GenerativeAnswerConfig): string {
  return config.limitParagraphs && !!config.paragraphsLimit ? `\n  max_paragraphs="${config.paragraphsLimit}"` : '';
}
export function getQueryPrepend(config: SearchBoxConfig): string {
  return config.prependTheQuery && !!config.queryPrepend.trim() ? `\n  query_prepend="${config.queryPrepend}"` : '';
}
export function getJsonSchema(config: ResultDisplayConfig): string {
  let schema = '';
  if (config.jsonOutput && !!config.jsonSchema.trim()) {
    try {
      schema = JSON.stringify(JSON.parse(config.jsonSchema.trim())).replace(/'/g, '’');
    } catch (e) {
      console.warn(`Malformed JSON schema`, config.jsonSchema.trim());
    }
  }
  return !!schema ? `\n  json_schema='${schema}'` : '';
}
export function getWidgetTheme(options: WidgetConfiguration): string {
  return options.darkMode === 'dark' ? `\n  mode="dark"` : '';
}
export function getReranker(config: SearchBoxConfig): string {
  return config.semanticReranking ? `\n  reranker="predict"` : '';
}
export function getCitationThreshold(config: ResultDisplayConfig): string {
  return config.showResultType === 'citations' && config.customizeThreshold
    ? `\n  citation_threshold="${config.citationThreshold}"`
    : '';
}
