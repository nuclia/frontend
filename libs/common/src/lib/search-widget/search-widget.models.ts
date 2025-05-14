import { cloneDeep, deepEqual } from '@flaps/core';
import {
  Ask,
  BaseSearchOptions,
  ChatOptions,
  INITIAL_CITATION_THRESHOLD,
  NUCLIA_STANDARD_SEARCH_CONFIG,
  getJsonSchemaValue,
  getPreselectedFilterValue,
  getRagStrategies,
  parseRAGImageStrategies,
  parseRAGStrategies,
  parsePreselectedFilters,
  RAG_METADATAS,
  RAGImageStrategy,
  RAGStrategy,
  RagStrategyName,
  Reranker,
  Search,
  SearchConfig,
  SearchOptions,
  Widget,
} from '@nuclia/core';

export const MODELS_SUPPORTING_VISION = ['chatgpt-vision', 'gemini-1-5-pro-vision'];
export const SAVED_CONFIG_KEY = 'NUCLIA_SELECTED_SEARCH_CONFIG';

export interface SearchAndWidgets {
  searchConfigurations?: Widget.SearchConfiguration[];
  widgets?: Widget.Widget[];
  ragLabQuestions?: string[];
}

export const DEFAULT_WIDGET_CONFIG: Widget.WidgetConfiguration = {
  widgetMode: 'page',
  darkMode: 'light',
  customizePlaceholder: false,
  placeholder: '',
  customizeChatPlaceholder: false,
  chatPlaceholder: '',
  customizeCopyDisclaimer: false,
  copyDisclaimer: '',
  customizeNotEnoughDataMessage: false,
  notEnoughDataMessage: '',
  hideLogo: false,
  permalink: false,
  displaySearchButton: false,
  navigateToLink: false,
  navigateToFile: false,
  navigateToOriginURL: false,
  hideDownload: false,
  openNewTab: false,
  noChatHistory: false,
  persistChatHistory: false,
  speech: false,
  speechSynthesis: false,
  feedback: 'none',
  lang: '',
  collapseTextBlocks: false,
  customizeCitationVisibility: false,
  citationVisibility: 'expanded',
};

export function isSameConfigurations(
  configA: Widget.AnySearchConfiguration,
  configB: Widget.AnySearchConfiguration,
): boolean {
  return deepEqual(configA, configB);
}

function getBaseSearchOptions(searchConfig: Widget.SearchConfiguration): BaseSearchOptions {
  const options: BaseSearchOptions = {
    vectorset: searchConfig.searchBox.vectorset || undefined,
    highlight: searchConfig.searchBox.highlight,
    rephrase: searchConfig.searchBox.rephraseQuery,
    autofilter: searchConfig.searchBox.autofilter,
    show_hidden: searchConfig.searchBox.showHiddenResources,
  };
  if (!searchConfig.searchBox.semanticReranking) {
    options.reranker = Reranker.NOOP;
  }
  if (searchConfig.searchBox.rrfBoosting && typeof searchConfig.searchBox.rrfSemanticBoosting === 'number') {
    options.rank_fusion = { name: 'rrf', boosting: { semantic: searchConfig.searchBox.rrfSemanticBoosting } };
  }
  if (searchConfig.searchBox.setPreselectedFilters && searchConfig.searchBox.preselectedFilters) {
    const filters = getPreselectedFilterValue(searchConfig.searchBox);
    if (filters) {
      options.filters = parsePreselectedFilters(filters);
    }
  }
  if (searchConfig.generativeAnswer.limitParagraphs && !!searchConfig.generativeAnswer.paragraphsLimit) {
    options.top_k = searchConfig.generativeAnswer.paragraphsLimit;
  }
  return options;
}

export function getChatOptions(searchConfig: Widget.SearchConfiguration, defaultGenerativeModel?: string): ChatOptions {
  const requestOptions: ChatOptions = {
    ...getBaseSearchOptions(searchConfig),
    generative_model: searchConfig.generativeAnswer.generativeModel || defaultGenerativeModel,
    prefer_markdown: searchConfig.generativeAnswer.preferMarkdown,
    citations: searchConfig.resultDisplay.showResultType === 'citations',
  };
  if (
    searchConfig.generativeAnswer.prompt.trim() ||
    searchConfig.generativeAnswer.systemPrompt.trim() ||
    searchConfig.searchBox.rephrasePrompt.trim()
  ) {
    requestOptions.prompt = {
      user: searchConfig.generativeAnswer.prompt.trim() || undefined,
      system: searchConfig.generativeAnswer.systemPrompt.trim() || undefined,
      rephrase: searchConfig.searchBox.rephrasePrompt.trim() || undefined,
    };
  }
  if (searchConfig.generativeAnswer.ragStrategies) {
    const { ragStrategies, ragImagesStrategies } = getRagStrategies(searchConfig.generativeAnswer.ragStrategies);
    requestOptions.rag_strategies = parseRAGStrategies(ragStrategies);
    requestOptions.rag_images_strategies = parseRAGImageStrategies(ragImagesStrategies);
  }
  if (
    searchConfig.generativeAnswer.limitTokenConsumption &&
    (searchConfig.generativeAnswer.tokenConsumptionLimit || searchConfig.generativeAnswer.outputTokenConsumptionLimit)
  ) {
    requestOptions.max_tokens = {
      context: searchConfig.generativeAnswer.tokenConsumptionLimit || undefined,
      answer: searchConfig.generativeAnswer.outputTokenConsumptionLimit || undefined,
    };
  }
  if (searchConfig.resultDisplay.showResultType === 'citations' && searchConfig.resultDisplay.customizeThreshold) {
    requestOptions.citation_threshold = searchConfig.resultDisplay.citationThreshold;
  }
  if (searchConfig.searchBox.rrfBoosting) {
    requestOptions.rank_fusion = {
      name: 'rrf',
      boosting: { semantic: searchConfig.searchBox.rrfSemanticBoosting || 1 },
    };
  }
  if (searchConfig.searchBox.generateAnswerWith === 'only-semantic') {
    requestOptions.features = [Ask.Features.SEMANTIC];
  }
  const schema = getJsonSchemaValue(searchConfig.resultDisplay);
  if (schema) {
    requestOptions.answer_json_schema = JSON.parse(schema);
  }
  return requestOptions;
}

export function getFindOptions(searchConfig: Widget.SearchConfiguration): SearchOptions {
  const options: SearchOptions = {
    ...getBaseSearchOptions(searchConfig),
    with_synonyms: searchConfig.searchBox.useSynonyms,
  };
  if (searchConfig.searchBox.generateAnswerWith === 'only-semantic') {
    options.features = [Search.Features.SEMANTIC];
  }
  if (
    searchConfig.searchBox.rephraseQuery &&
    searchConfig.searchBox.useRephrasePrompt &&
    !!searchConfig.searchBox.rephrasePrompt.trim()
  ) {
    options.rephrase_prompt = searchConfig.searchBox.rephrasePrompt;
  }
  return options;
}
