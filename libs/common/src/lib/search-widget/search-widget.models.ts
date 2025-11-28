import { cloneDeep, deepEqual } from '@flaps/core';
import {
  Ask,
  BaseSearchOptions,
  ChatOptions,
  getJsonSchemaValue,
  getPreselectedFilterValue,
  getRagStrategies,
  parseRAGImageStrategies,
  parseRAGStrategies,
  parsePreselectedFilters,
  Reranker,
  Search,
  SearchOptions,
  Widget,
  SearchConfig,
  NUCLIA_STANDARD_SEARCH_CONFIG,
  INITIAL_CITATION_THRESHOLD,
  DEFAULT_GENERATIVE_ANSWER_CONFIG,
  RAGStrategy,
  RAGImageStrategy,
  RAG_METADATAS,
} from '@nuclia/core';

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
  } else if (searchConfig.searchBox.setPreselectedFilters && searchConfig.searchBox.preselectedFilterExpression) {
    try {
      options.filter_expression = JSON.parse(searchConfig.searchBox.preselectedFilterExpression);
    } catch {}
  }
  if (searchConfig.searchBox.limitParagraphs && !!searchConfig.searchBox.paragraphsLimit) {
    options.top_k = searchConfig.searchBox.paragraphsLimit;
  }
  return options;
}

export function getChatOptions(searchConfig: Widget.SearchConfiguration, defaultGenerativeModel?: string): ChatOptions {
  const requestOptions: ChatOptions = {
    ...getBaseSearchOptions(searchConfig),
    generative_model: searchConfig.generativeAnswer.generativeModel || defaultGenerativeModel,
    prefer_markdown: searchConfig.generativeAnswer.preferMarkdown,
    citations:
      searchConfig.resultDisplay.showResultType === 'citations'
        ? true
        : searchConfig.resultDisplay.showResultType === 'llmCitations'
          ? 'llm_footnotes'
          : false,
  };
  if (
    (searchConfig.generativeAnswer.usePrompt && searchConfig.generativeAnswer.prompt.trim()) ||
    (searchConfig.generativeAnswer.useSystemPrompt && searchConfig.generativeAnswer.systemPrompt.trim()) ||
    (searchConfig.searchBox.useRephrasePrompt && searchConfig.searchBox.rephrasePrompt.trim())
  ) {
    requestOptions.prompt = {
      user: (searchConfig.generativeAnswer.usePrompt && searchConfig.generativeAnswer.prompt.trim()) || undefined,
      system:
        (searchConfig.generativeAnswer.useSystemPrompt && searchConfig.generativeAnswer.systemPrompt.trim()) ||
        undefined,
      rephrase: (searchConfig.searchBox.useRephrasePrompt && searchConfig.searchBox.rephrasePrompt.trim()) || undefined,
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
  if (searchConfig.searchBox.useSecurityGroups && searchConfig.searchBox.securityGroups) {
    requestOptions.security = {
      groups: searchConfig.searchBox.securityGroups.split('\n').map((group) => group.trim()),
    };
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

export function getSearchConfigFromSearchOptions(id: string, searchOptions: SearchConfig): Widget.SearchConfiguration {
  const config = cloneDeep(NUCLIA_STANDARD_SEARCH_CONFIG) as Widget.SearchConfiguration;
  config.id = id;
  const options = searchOptions.config;
  config.searchBox = {
    ...config.searchBox,
    highlight: !!options.highlight,
    limitParagraphs: typeof options.top_k === 'number',
    paragraphsLimit: typeof options.top_k === 'number' ? options.top_k : null,
    rephraseQuery: !!options.rephrase,
    securityGroups: !!options.security?.groups ? options.security.groups.join('\n') : '',
    semanticReranking: !options.reranker || options.reranker === 'predict',
    showHiddenResources: !!options.show_hidden,
    useSecurityGroups: !!options.security,
    vectorset: options.vectorset || '',
  };
  config.generativeAnswer = {
    ...config.generativeAnswer,
    generateAnswer: searchOptions.kind === 'ask',
  };
  if (options.filters && options.filters.length > 0) {
    config.searchBox.setPreselectedFilters = true;
    config.searchBox.preselectedFilters =
      typeof options.filters?.[0] === 'string'
        ? options.filters.join('\n')
        : options.filters.map((filter) => JSON.stringify(filter)).join('\n');
  }
  if (options.filter_expression) {
    config.searchBox.setPreselectedFilters = true;
    try {
      config.searchBox.preselectedFilterExpression = JSON.stringify(options.filter_expression, null, 2);
    } catch {}
  }
  if (options.rank_fusion) {
    config.searchBox.rrfBoosting = true;
    if (options.rank_fusion.boosting.semantic) {
      config.searchBox.rrfSemanticBoosting = options.rank_fusion.boosting.semantic;
    }
  }
  if (searchOptions.kind === 'ask') {
    const askOptions = options as ChatOptions;
    config.resultDisplay = {
      ...config.resultDisplay,
      showResultType:
        askOptions.citations === true || askOptions.citations == 'default'
          ? 'citations'
          : !askOptions.citations || askOptions.citations == 'none'
            ? 'all-resources'
            : 'llmCitations',
      jsonOutput: !!askOptions.answer_json_schema,
      jsonSchema: askOptions.answer_json_schema ? JSON.stringify(askOptions.answer_json_schema, null, 2) : '',
      customizeThreshold: typeof askOptions.citation_threshold === 'number',
      citationThreshold:
        typeof askOptions.citation_threshold === 'number' ? askOptions.citation_threshold : INITIAL_CITATION_THRESHOLD,
    };
    config.searchBox = {
      ...config.searchBox,
      generateAnswerWith:
        !askOptions.features || askOptions.features?.includes(Ask.Features.KEYWORD)
          ? 'semantic-and-full-text'
          : 'only-semantic',
    };
    config.generativeAnswer = {
      ...config.generativeAnswer,
      generativeModel: askOptions.generative_model || '',
      preferMarkdown: !!askOptions.prefer_markdown,
    };
    if (askOptions.prompt) {
      if (typeof askOptions.prompt === 'string') {
        config.generativeAnswer.usePrompt = true;
        config.generativeAnswer.prompt = askOptions.prompt;
      } else {
        config.generativeAnswer.usePrompt = !!askOptions.prompt.user;
        config.generativeAnswer.prompt = askOptions.prompt.user || '';
        config.generativeAnswer.useSystemPrompt = !!askOptions.prompt.system;
        config.generativeAnswer.systemPrompt = askOptions.prompt.system || '';
        if (askOptions.prompt.rephrase) {
          config.searchBox.useRephrasePrompt = true;
          config.searchBox.rephrasePrompt = askOptions.prompt.rephrase;
        }
      }
    }
    if (askOptions.max_tokens) {
      config.generativeAnswer.limitTokenConsumption = true;
      if (typeof askOptions.max_tokens === 'number') {
        config.generativeAnswer.outputTokenConsumptionLimit = askOptions.max_tokens;
      } else {
        config.generativeAnswer.tokenConsumptionLimit = askOptions.max_tokens.context || null;
        config.generativeAnswer.outputTokenConsumptionLimit = askOptions.max_tokens.answer || null;
      }
    }
    config.generativeAnswer.ragStrategies = getRagStrategyFromSearchOptions(
      askOptions.rag_strategies || [],
      askOptions.rag_images_strategies || [],
    );
  }
  if (searchOptions.kind === 'find') {
    const findOptions = options as SearchOptions;
    config.searchBox.useSynonyms = !!findOptions.with_synonyms;
    config.searchBox.useRephrasePrompt = !!findOptions.rephrase_prompt;
    config.searchBox.rephrasePrompt = findOptions.rephrase_prompt || '';
    config.searchBox.generateAnswerWith =
      !findOptions.features || findOptions.features?.includes(Search.Features.KEYWORD)
        ? 'semantic-and-full-text'
        : 'only-semantic';
  }
  return config;
}

function getRagStrategyFromSearchOptions(strategies: RAGStrategy[], imageStrategies: RAGImageStrategy[]) {
  const config = cloneDeep({
    ...DEFAULT_GENERATIVE_ANSWER_CONFIG.ragStrategies,
    includeNeighbouringParagraphs: false,
    precedingParagraphs: null,
    succeedingParagraphs: null,
  }) as Widget.RagStrategiesConfig;

  strategies.forEach((ragStrategy) => {
    switch (ragStrategy.name) {
      case 'full_resource':
        config.entireResourceAsContext = true;
        config.includeRemaining = !!ragStrategy.include_remaining_text_blocks;
        if (ragStrategy.count) {
          config.maxNumberOfResources = ragStrategy.count;
        }
        if (ragStrategy.apply_to?.exclude) {
          config.excludeFilter = ragStrategy.apply_to.exclude.join(',');
        }
        break;
      case 'field_extension':
        config.fieldsAsContext = true;
        config.fieldIds = ragStrategy.fields?.join('\n') || '';
        config.dataAugmentationFieldPrefixes = ragStrategy.data_augmentation_field_prefixes?.join('\n') || '';
        break;
      case 'conversation':
        config.conversationalRagStrategy = true;
        config.conversationOptions = {
          attachmentsText: !!ragStrategy.attachments_text,
          attachmentsImages: !!ragStrategy.attachments_images,
          full: !!ragStrategy.full,
        };
        if (typeof ragStrategy.max_messages === 'number') {
          config.maxMessages = ragStrategy.max_messages;
        }
        break;
      case 'metadata_extension':
        config.metadatasRagStrategy = true;
        config.metadatas = {
          ...config.metadatas,
          ...ragStrategy.types.reduce(
            (acc, type) => {
              acc[type] = true;
              return acc;
            },
            {} as { [key in RAG_METADATAS]: boolean },
          ),
        };
        break;
      case 'hierarchy':
        config.includeTextualHierarchy = true;
        break;
      case 'neighbouring_paragraphs':
        config.includeNeighbouringParagraphs = true;
        if (typeof ragStrategy.before === 'number') {
          config.precedingParagraphs = ragStrategy.before;
        }
        if (typeof ragStrategy.after === 'number') {
          config.succeedingParagraphs = ragStrategy.after;
        }
        break;
      case 'graph_beta':
        config.graphRagStrategy = true;
        config.graph = {
          agentic_graph_only: !!ragStrategy.agentic_graph_only,
          exclude_processor_relations: !!ragStrategy.exclude_processor_relations,
          relation_text_as_paragraphs: !!ragStrategy.relation_text_as_paragraphs,
          generative_relation_ranking: ragStrategy.relation_ranking === 'generative',
          suggest_query_entity_detection: ragStrategy.query_entity_detection === 'suggest',
          hops: typeof ragStrategy.hops === 'number' ? ragStrategy.hops : null,
          top_k: typeof ragStrategy.top_k === 'number' ? ragStrategy.top_k : null,
        };
        break;
    }
  });
  imageStrategies.forEach((ragStrategy) => {
    switch (ragStrategy.name) {
      case 'page_image':
        config.includePageImages = true;
        config.maxNumberOfImages = typeof ragStrategy.count === 'number' ? ragStrategy.count : null;
        break;
      case 'paragraph_image':
        config.includeParagraphImages = true;
    }
  });
  return config;
}
