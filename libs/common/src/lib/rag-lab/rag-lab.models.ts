import { ChatOptions, getRAGImageStrategies, getRAGStrategies, Reranker } from '@nuclia/core';
import { getPreselectedFilterList, getRagStrategies, SearchConfiguration } from '../search-widget';

export const GENERATIVE_MODEL_KEY = 'generative_model';

export interface RequestConfig extends ChatOptions {
  searchConfigId?: string;
}

export interface RequestConfigAndQueries extends RequestConfig {
  queries: string[];
}

export interface ResultEntry {
  model: string;
  modelName: string;
  answer: string;
  configId?: string;
  rendered?: string;
}

export const getRequestOptions = function (
  searchConfig: SearchConfiguration,
  defaultGenerativeModel?: string,
): ChatOptions {
  const requestOptions: ChatOptions = {
    generative_model: searchConfig.generativeAnswer.generativeModel || defaultGenerativeModel,
    vectorset: searchConfig.searchBox.vectorset || undefined,
    highlight: false, // highlight is set to false by default on the widget, so we do the same here
    rephrase: searchConfig.searchBox.rephraseQuery,
    autofilter: searchConfig.searchBox.autofilter,
    prefer_markdown: searchConfig.generativeAnswer.preferMarkdown,
    citations: searchConfig.resultDisplay.showResultType === 'citations',
    show_hidden: searchConfig.searchBox.showHiddenResources,
  };
  if (searchConfig.searchBox.semanticReranking) {
    requestOptions.reranker = Reranker.PREDICT;
  }
  if (searchConfig.searchBox.rrfBoosting && typeof searchConfig.searchBox.rrfSemanticBoosting === 'number') {
    requestOptions.rank_fusion = { name: 'rrf', boosting: { semantic: searchConfig.searchBox.rrfSemanticBoosting } };
  }
  if (
    searchConfig.generativeAnswer.prompt ||
    searchConfig.generativeAnswer.systemPrompt ||
    searchConfig.searchBox.rephrasePrompt
  ) {
    requestOptions.prompt = {
      user: searchConfig.generativeAnswer.prompt || undefined,
      system: searchConfig.generativeAnswer.systemPrompt || undefined,
      rephrase: searchConfig.searchBox.rephrasePrompt || undefined,
    };
  }
  if (searchConfig.searchBox.setPreselectedFilters && searchConfig.searchBox.preselectedFilters) {
    requestOptions.filters = getPreselectedFilterList(searchConfig.searchBox);
  }
  if (searchConfig.generativeAnswer.ragStrategies) {
    const { ragStrategies, ragImagesStrategies } = getRagStrategies(searchConfig.generativeAnswer.ragStrategies);
    requestOptions.rag_strategies = getRAGStrategies(ragStrategies);
    requestOptions.rag_images_strategies = getRAGImageStrategies(ragImagesStrategies);
  }
  if (searchConfig.generativeAnswer.limitTokenConsumption && searchConfig.generativeAnswer.tokenConsumptionLimit) {
    requestOptions.max_tokens = searchConfig.generativeAnswer.tokenConsumptionLimit;
  }
  if (searchConfig.generativeAnswer.limitParagraphs && !!searchConfig.generativeAnswer.paragraphsLimit) {
    requestOptions.top_k = searchConfig.generativeAnswer.paragraphsLimit;
  }
  return requestOptions;
};
