import {
  FullResourceStrategy,
  GraphStrategy,
  HierarchyStrategy,
  RAG_METADATAS,
  RAGImageStrategy,
  RagImageStrategyName,
  RAGStrategy,
  RagStrategyName,
  SearchConfig,
} from '../kb';
import { Filter, Reranker } from './search.models';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Widget {
  export type FilterType = 'labels' | 'entities' | 'created' | 'labelFamilies';
  export type FilterSelectionType = { [key in FilterType]: boolean };
  export type WidgetFeedback = 'none' | 'answer' | 'answerAndResults';

  export interface SearchBoxConfig {
    filter: boolean;
    filterLogic: 'and' | 'or';
    autofilter: boolean;
    setPreselectedFilters: boolean;
    suggestions: boolean;
    useSynonyms: boolean;
    highlight: boolean;
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
    rrfBoosting: boolean;
    rrfSemanticBoosting?: number;
    vectorset: string; // aka semantic model
    useSearchResults: boolean;
  }

  export interface RagStrategiesConfig {
    includeTextualHierarchy: boolean;
    metadatasRagStrategy: boolean;
    metadatas: { [key in RAG_METADATAS]: boolean } | undefined;
    graphRagStrategy: boolean;
    graph:
      | {
          hops: number | null;
          top_k: number | null;
          agentic_graph_only: boolean;
          relation_text_as_paragraphs: boolean;
          generative_relation_ranking: boolean;
          suggest_query_entity_detection: boolean;
        }
      | undefined;
    includeNeighbouringParagraphs: boolean;
    precedingParagraphs: number | null;
    succeedingParagraphs: number | null;
    entireResourceAsContext: boolean;
    maxNumberOfResources: number | null;
    excludeFilter: string;
    includeRemaining: boolean;
    fieldsAsContext: boolean;
    fieldIds: string;
    conversationalRagStrategy: boolean;
    conversationOptions: {
      attachmentsText: boolean;
      attachmentsImages: boolean;
      full: boolean;
    };
    maxMessages: number | null;
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
    contextImages: boolean;
    ragStrategies: RagStrategiesConfig;
  }

  export interface ResultDisplayConfig {
    displayResults: boolean;
    showResultType: 'citations' | 'all-resources';
    displayMetadata: boolean;
    hideAnswer: boolean;
    metadatas?: string[];
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

  export interface SearchAPIConfig {
    id: string;
    value: SearchConfig;
    type: 'api';
  }
  export type TypedSearchConfiguration = SearchConfiguration & { type: 'config' };
  export type AnySearchConfiguration = TypedSearchConfiguration | SearchAPIConfig;

  export interface SearchConfiguration {
    id: string;
    searchBox: SearchBoxConfig;
    generativeAnswer: GenerativeAnswerConfig;
    resultDisplay: ResultDisplayConfig;
    // obsolete, but preserved for backward compatibility
    unsupported?: boolean;
    sourceConfig?: SearchConfig;
  }

  export interface WidgetConfiguration {
    widgetMode: 'page' | 'popup' | 'chat';
    darkMode: 'light' | 'dark';
    customizePlaceholder: boolean;
    placeholder: string;
    customizeChatPlaceholder: boolean;
    chatPlaceholder: string;
    customizeCopyDisclaimer: boolean;
    copyDisclaimer: string;
    customizeNotEnoughDataMessage: boolean;
    notEnoughDataMessage: string;
    hideLogo: boolean;
    permalink: boolean;
    displaySearchButton: boolean;
    navigateToLink: boolean;
    navigateToFile: boolean;
    navigateToOriginURL: boolean;
    hideDownload: boolean;
    openNewTab: boolean;
    noChatHistory: boolean;
    persistChatHistory: boolean;
    speech: boolean;
    speechSynthesis: boolean;
    feedback: WidgetFeedback;
    lang: string;
    collapseTextBlocks: boolean;
    customizeCitationVisibility: boolean;
    citationVisibility: 'expanded' | 'collapsed';
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

  export interface WidgetFeatures {
    filter?: boolean;
    highlight?: boolean;
    navigateToFile?: boolean;
    navigateToLink?: boolean;
    navigateToOriginURL?: boolean;
    permalink?: boolean;
    relations?: boolean;
    suggestions?: boolean;
    autocompleteFromNERs?: boolean;
    displayMetadata?: boolean;
    answers?: boolean;
    hideLogo?: boolean;
    hideResults?: boolean;
    hideThumbnails?: boolean;
    displayFieldList?: boolean;
    knowledgeGraph?: boolean;
    useSynonyms?: boolean;
    autofilter?: boolean;
    /**
     * @deprecated use semanticOnly
     */
    noBM25forChat?: boolean;
    citations?: boolean;
    rephrase?: boolean;
    debug?: boolean;
    preferMarkdown?: boolean;
    openNewTab?: boolean;
    orFilterLogic?: boolean;
    noChatHistory?: boolean;
    showHidden?: boolean;
    showAttachedImages?: boolean;
    speech?: boolean;
    speechSynthesis?: boolean;
    semanticOnly?: boolean;
    expandCitations?: boolean;
    collapseCitations?: boolean;
    collapseTextBlocks?: boolean;
    displaySearchButton?: boolean;
    hideDownload?: boolean;
    disableRAG?: boolean;
    persistChatHistory?: boolean;
    hideAnswer?: boolean;
    contextImages?: boolean;
  }
}

export const NUCLIA_STANDARD_SEARCH_CONFIG_ID = 'nuclia-standard';
export const INITIAL_CITATION_THRESHOLD = 0.4;

const DEFAULT_SEARCH_BOX_CONFIG: Widget.SearchBoxConfig = {
  filter: false,
  filters: {
    labels: true,
    entities: false,
    created: false,
    labelFamilies: false,
  },
  filterLogic: 'and',
  autofilter: false,
  setPreselectedFilters: false,
  preselectedFilters: '',
  suggestions: false,
  suggestResults: false,
  autocompleteFromNERs: false,
  useSynonyms: false,
  highlight: false,
  prependTheQuery: false,
  queryPrepend: '',
  rephraseQuery: true,
  useRephrasePrompt: false,
  rephrasePrompt: '',
  generateAnswerWith: 'semantic-and-full-text',
  showHiddenResources: false,
  semanticReranking: true,
  rrfBoosting: false,
  vectorset: '',
  useSearchResults: true,
};
const DEFAULT_GENERATIVE_ANSWER_CONFIG: Widget.GenerativeAnswerConfig = {
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
  contextImages: false,
  ragStrategies: {
    includeTextualHierarchy: false,
    metadatasRagStrategy: false,
    metadatas: {
      origin: false,
      classification_labels: false,
      ners: false,
      extra_metadata: false,
    },
    graphRagStrategy: false,
    graph: undefined,
    includeNeighbouringParagraphs: true,
    precedingParagraphs: 2,
    succeedingParagraphs: 2,
    entireResourceAsContext: false,
    maxNumberOfResources: null,
    includeRemaining: false,
    excludeFilter: '',
    fieldsAsContext: false,
    fieldIds: '',
    conversationalRagStrategy: false,
    conversationOptions: {
      attachmentsText: false,
      attachmentsImages: false,
      full: false,
    },
    maxMessages: null,
    includePageImages: false,
    maxNumberOfImages: null,
    includeParagraphImages: false,
  },
};
const DEFAULT_RESULT_DISPLAY_CONFIG: Widget.ResultDisplayConfig = {
  displayResults: false,
  showResultType: 'citations',
  displayMetadata: false,
  hideAnswer: false,
  metadatas: [],
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

export const NUCLIA_STANDARD_SEARCH_CONFIG: Widget.TypedSearchConfiguration = {
  type: 'config',
  id: NUCLIA_STANDARD_SEARCH_CONFIG_ID,
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

export function parseRAGStrategies(ragStrategies: string): RAGStrategy[] {
  // ragStrategies format example: 'full_resource|3|true|/classification.labels/doctype/product_manuals#/icon/image,field_extension|t/field1|f/field2,hierarchy|2,neighbouring_paragraphs|2|2,conversation|attachments_text|15'
  if (!ragStrategies) {
    return [];
  }
  const strategies: RAGStrategy[] = ragStrategies
    .split(',')
    .map((strategy) => {
      const [name, ...rest] = strategy.split('|');
      if (name === RagStrategyName.FULL_RESOURCE) {
        const fullResourceStartegy: FullResourceStrategy = { name };
        if (rest.length >= 1) {
          fullResourceStartegy.count = parseInt(rest[0], 10);
        }
        if (rest.length >= 2) {
          fullResourceStartegy.include_remaining_text_blocks = rest[1] === 'true';
        }
        if (rest.length === 3) {
          fullResourceStartegy.apply_to = { exclude: rest[2].split('#') };
        }
        return fullResourceStartegy;
      } else if (name === RagStrategyName.HIERARCHY) {
        const hierarchyStartegy: HierarchyStrategy = { name };
        if (rest.length === 1) {
          hierarchyStartegy.count = parseInt(rest[0], 10);
        }
        return hierarchyStartegy;
      } else if (name === RagStrategyName.FIELD_EXTENSION) {
        return { name, fields: rest };
      } else if (name === RagStrategyName.METADATAS) {
        return { name, types: rest };
      } else if (name === RagStrategyName.NEIGHBOURING_PARAGRAPHS) {
        return { name, before: parseInt(rest[0]) || 0, after: parseInt(rest[1]) || 0 };
      } else if (name === RagStrategyName.CONVERSATION) {
        const maxMessages = parseInt(rest[rest.length - 1], 10);
        return {
          name,
          attachments_text: rest.includes('attachments_text'),
          attachments_images: rest.includes('attachments_images'),
          full: rest.includes('full'),
          max_messages: rest.includes('full') || isNaN(maxMessages) ? undefined : maxMessages,
        };
      } else if (name === RagStrategyName.GRAPH) {
        const strategy: Partial<GraphStrategy> = { name, hops: parseInt(rest[0], 10), top_k: parseInt(rest[1], 10) };
        if (rest.length > 2) {
          strategy.agentic_graph_only = rest[2] === 'true';
        }
        if (rest.length > 3) {
          strategy.relation_text_as_paragraphs = rest[3] === 'true';
        }
        if (rest.length > 4) {
          strategy.relation_ranking = rest[4] === 'true' ? 'generative' : 'reranker';
        }
        if (rest.length > 5) {
          strategy.query_entity_detection = rest[5] === 'true' ? 'suggest' : 'predict';
        }
        return strategy;
      } else {
        console.error(`Unknown RAG strategy: ${name}`);
        return undefined;
      }
    })
    .filter((s) => s) as RAGStrategy[];
  const strategiesNames = strategies.map((s) => s.name);
  if (
    (strategiesNames.includes(RagStrategyName.FIELD_EXTENSION) ||
      strategiesNames.includes(RagStrategyName.HIERARCHY) ||
      strategiesNames.includes(RagStrategyName.NEIGHBOURING_PARAGRAPHS)) &&
    strategiesNames.includes(RagStrategyName.FULL_RESOURCE)
  ) {
    console.error(
      `Incompatible RAG strategies: 'full_resource' strategy is not compatible with 'field_extension', 'hierarchy' or 'neighbouring_paragraphs'`,
    );
    return [];
  }
  return strategies;
}

export function parseRAGImageStrategies(ragImageStrategies: string): RAGImageStrategy[] {
  // ragImageStrategies format example: 'page_image|3,paragraph_image'
  if (!ragImageStrategies) {
    return [];
  }
  const strategies: RAGImageStrategy[] = ragImageStrategies
    .split(',')
    .map((strategy) => {
      const [name, ...rest] = strategy.split('|');
      if (name === RagImageStrategyName.PAGE_IMAGE) {
        return { name, count: parseInt(rest[0], 10) };
      } else if (name === RagImageStrategyName.PARAGRAPH_IMAGE) {
        return { name };
      } else {
        console.error(`Unknown RAG image strategy: ${name}`);
        return undefined;
      }
    })
    .filter((s) => s) as RAGImageStrategy[];
  return strategies as RAGImageStrategy[];
}

export function parsePreselectedFilters(preselectedFilters: string): string[] | Filter[] {
  const advancedFilterRE = /({[^{}]+})/g;
  const advancedFilters = preselectedFilters.match(advancedFilterRE);
  return advancedFilters
    ? advancedFilters
        .map((filter) => {
          try {
            return JSON.parse(filter);
          } catch (e) {
            console.warn('Malformed advanced filter: wrong JSON syntax.', filter);
            return undefined;
          }
        })
        .filter((filter) => filter)
    : preselectedFilters.split(',');
}

export function getWidgetParameters(
  searchConfig: Widget.SearchConfiguration,
  widgetOptions: Widget.WidgetConfiguration,
) {
  const { ragProperties, ragImagesProperties } = getRagStrategiesProperties(
    searchConfig.generativeAnswer.ragStrategies,
  );
  return {
    features: getFeatures(searchConfig, widgetOptions),
    prompt: getPrompt(searchConfig.generativeAnswer),
    system_prompt: getSystemPrompt(searchConfig.generativeAnswer),
    rephrase_prompt: getRephrasePrompt(searchConfig.searchBox),
    filters: getFilters(searchConfig.searchBox),
    preselected_filters: getPreselectedFilters(searchConfig.searchBox),
    rag_strategies: ragProperties,
    rag_images_strategies: ragImagesProperties,
    ask_to_resource: getAskToResource(searchConfig.generativeAnswer),
    max_tokens: getMaxTokens(searchConfig.generativeAnswer),
    max_output_tokens: getMaxOutputTokens(searchConfig.generativeAnswer),
    max_paragraphs: getMaxParagraphs(searchConfig.generativeAnswer),
    generativemodel: searchConfig.generativeAnswer.generativeModel ? searchConfig.generativeAnswer.generativeModel : '',
    vectorset: searchConfig.searchBox.vectorset ? searchConfig.searchBox.vectorset : '',
    query_prepend: getQueryPrepend(searchConfig.searchBox),
    json_schema: getJsonSchema(searchConfig.resultDisplay),
    metadata: getMetadata(searchConfig.resultDisplay),
    reranker: getReranker(searchConfig.searchBox),
    rrf_boosting: getRrfBoosting(searchConfig.searchBox),
    citation_threshold: getCitationThreshold(searchConfig.resultDisplay),
    placeholder: getPlaceholder(widgetOptions),
    chat_placeholder: getChatPlaceholder(widgetOptions),
    copy_disclaimer: getCopyDisclaimer(widgetOptions),
    lang: getLang(widgetOptions),
    not_enough_data_message: getNotEnoughDataMessage(widgetOptions),
    mode: getWidgetTheme(widgetOptions),
    feedback: widgetOptions.feedback,
  };
}

export function getFeatures(config: Widget.SearchConfiguration, widgetOptions: Widget.WidgetConfiguration): string {
  const widgetFeatures = {
    // Search configuration
    answers: config.generativeAnswer.generateAnswer,
    preferMarkdown: config.generativeAnswer.generateAnswer && config.generativeAnswer.preferMarkdown,
    contextImages: config.generativeAnswer.generateAnswer && config.generativeAnswer.contextImages,
    semanticOnly: config.searchBox.generateAnswerWith === 'only-semantic',
    rephrase: config.searchBox.rephraseQuery,
    filter: config.searchBox.filter,
    orFilterLogic: config.searchBox.filter && config.searchBox.filterLogic === 'or',
    autofilter: config.searchBox.autofilter,
    useSynonyms: config.searchBox.useSynonyms,
    highlight: config.searchBox.highlight,
    suggestions: config.searchBox.suggestions,
    autocompleteFromNERs: config.searchBox.suggestions && config.searchBox.autocompleteFromNERs,
    showHidden: config.searchBox.showHiddenResources,
    citations: config.resultDisplay.displayResults && config.resultDisplay.showResultType === 'citations',
    hideResults: !config.resultDisplay.displayResults || config.resultDisplay.showResultType === 'citations',
    displayMetadata: config.resultDisplay.displayMetadata,
    hideAnswer: config.resultDisplay.hideAnswer,
    hideThumbnails: !config.resultDisplay.displayThumbnails,
    showAttachedImages: config.resultDisplay.showAttachedImages,
    relations: config.resultDisplay.relations,
    knowledgeGraph: config.resultDisplay.relationGraph,
    displayFieldList: config.resultDisplay.displayFieldList,
    disableRAG: config.searchBox.useSearchResults === undefined ? false : !config.searchBox.useSearchResults,

    // Widget options
    hideLogo: widgetOptions.hideLogo,
    permalink: widgetOptions.permalink,
    displaySearchButton: widgetOptions.displaySearchButton,
    navigateToLink: widgetOptions.navigateToLink,
    navigateToFile: widgetOptions.navigateToFile,
    navigateToOriginURL: widgetOptions.navigateToOriginURL,
    hideDownload: widgetOptions.hideDownload,
    openNewTab:
      (widgetOptions.navigateToLink || widgetOptions.navigateToFile || widgetOptions.navigateToOriginURL) &&
      widgetOptions.openNewTab,
    noChatHistory: widgetOptions.noChatHistory,
    persistChatHistory: widgetOptions.persistChatHistory,
    speech: widgetOptions.speech,
    speechSynthesis: widgetOptions.speechSynthesis,
    collapseTextBlocks: widgetOptions.collapseTextBlocks,
    expandCitations: widgetOptions.customizeCitationVisibility && widgetOptions.citationVisibility === 'expanded',
    collapseCitations: widgetOptions.customizeCitationVisibility && widgetOptions.citationVisibility === 'collapsed',
  };
  return Object.entries(widgetFeatures)
    .filter(([, enabled]) => enabled)
    .map(([feature]) => feature)
    .join(',');
}
function getPlaceholder(config: Widget.WidgetConfiguration): string {
  return config.customizePlaceholder && config.placeholder.trim() ? config.placeholder : '';
}
function getChatPlaceholder(config: Widget.WidgetConfiguration): string {
  return config.customizeChatPlaceholder && config.chatPlaceholder.trim() ? config.chatPlaceholder : '';
}
function getCopyDisclaimer(config: Widget.WidgetConfiguration): string {
  return config.customizeCopyDisclaimer && config.copyDisclaimer.trim() ? config.copyDisclaimer : '';
}
function getLang(config: Widget.WidgetConfiguration): string {
  return config.lang ? config.lang : '';
}
function getPrompt(config: Widget.GenerativeAnswerConfig): string {
  if (config.usePrompt && !!config.prompt.trim()) {
    return config.prompt;
  }
  return '';
}
function getSystemPrompt(config: Widget.GenerativeAnswerConfig): string {
  if (config.useSystemPrompt && !!config.systemPrompt.trim()) {
    return config.systemPrompt;
  }
  return '';
}
function getRephrasePrompt(config: Widget.SearchBoxConfig): string {
  if (config.rephraseQuery && config.useRephrasePrompt && !!config.rephrasePrompt.trim()) {
    return config.rephrasePrompt;
  }
  return '';
}
function getFilters(config: Widget.SearchBoxConfig): string {
  if (!config.filter) {
    return '';
  }
  return Object.entries(config.filters)
    .filter(([, value]) => value)
    .map(([key]) => key)
    .join(',');
}
export function getPreselectedFilterValue(config: Widget.SearchBoxConfig): string {
  return config.preselectedFilters
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
}

function getPreselectedFilters(config: Widget.SearchBoxConfig): string {
  const value = getPreselectedFilterValue(config);
  return config.setPreselectedFilters && value ? value : '';
}

export function getRagStrategies(ragStrategiesConfig: Widget.RagStrategiesConfig) {
  const ragStrategies: string[] = [];
  if (ragStrategiesConfig.entireResourceAsContext) {
    let entireResourceAsContext = `${RagStrategyName.FULL_RESOURCE}|${ragStrategiesConfig.maxNumberOfResources || 5}|${
      ragStrategiesConfig.includeRemaining
    }`;
    if (ragStrategiesConfig.excludeFilter) {
      entireResourceAsContext += `|${ragStrategiesConfig.excludeFilter
        .split(',')
        .map((f) => f.trim())
        .join('#')}`;
    }
    ragStrategies.push(entireResourceAsContext);
  } else {
    if (ragStrategiesConfig.fieldsAsContext && ragStrategiesConfig.fieldIds) {
      const fieldIds = ragStrategiesConfig.fieldIds
        .split(`\n`)
        .map((id) => id.trim())
        .join('|');
      ragStrategies.push(`${RagStrategyName.FIELD_EXTENSION}|${fieldIds}`);
    }
    if (ragStrategiesConfig.includeTextualHierarchy) {
      ragStrategies.push(RagStrategyName.HIERARCHY);
    }
    if (ragStrategiesConfig.includeNeighbouringParagraphs) {
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
  if (ragStrategiesConfig.graphRagStrategy && ragStrategiesConfig.graph) {
    let strategy = `${RagStrategyName.GRAPH}`;
    strategy += `|${ragStrategiesConfig.graph.hops || 3}`;
    strategy += `|${ragStrategiesConfig.graph.top_k || 50}`;
    strategy += `|${ragStrategiesConfig.graph.agentic_graph_only}`;
    strategy += `|${ragStrategiesConfig.graph.relation_text_as_paragraphs}`;
    strategy += `|${ragStrategiesConfig.graph.generative_relation_ranking}`;
    strategy += `|${ragStrategiesConfig.graph.suggest_query_entity_detection}`;
    ragStrategies.push(strategy);
  }
  if (ragStrategiesConfig.conversationalRagStrategy) {
    const options = ragStrategiesConfig.conversationOptions;
    const maxMessages =
      !options.full && typeof ragStrategiesConfig.maxMessages === 'number' ? `|${ragStrategiesConfig.maxMessages}` : '';
    ragStrategies.push(
      `${RagStrategyName.CONVERSATION}${options.attachmentsText ? '|attachments_text' : ''}${
        options.attachmentsImages ? '|attachments_images' : ''
      }${options.full ? '|full' : ''}${maxMessages}`,
    );
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
function getRagStrategiesProperties(ragStrategiesConfig: Widget.RagStrategiesConfig) {
  const { ragStrategies, ragImagesStrategies } = getRagStrategies(ragStrategiesConfig);
  const ragProperties = ragStrategies.length > 0 ? ragStrategies : '';
  const ragImagesProperties = ragImagesStrategies.length > 0 ? ragImagesStrategies : '';

  return { ragProperties, ragImagesProperties };
}
function getNotEnoughDataMessage(config: Widget.WidgetConfiguration): string {
  return config.customizeNotEnoughDataMessage && !!config.notEnoughDataMessage.trim()
    ? config.notEnoughDataMessage.trim()
    : '';
}
function getAskToResource(config: Widget.GenerativeAnswerConfig): string {
  return config.askSpecificResource && !!config.specificResourceSlug.trim() ? config.specificResourceSlug.trim() : '';
}
function getMaxTokens(config: Widget.GenerativeAnswerConfig): string | undefined {
  return config.limitTokenConsumption && !!config.tokenConsumptionLimit
    ? config.tokenConsumptionLimit.toString()
    : undefined;
}
function getMaxOutputTokens(config: Widget.GenerativeAnswerConfig): string | undefined {
  return config.limitTokenConsumption && !!config.outputTokenConsumptionLimit
    ? config.outputTokenConsumptionLimit.toString()
    : undefined;
}
function getMaxParagraphs(config: Widget.GenerativeAnswerConfig): string | undefined {
  return config.limitParagraphs && !!config.paragraphsLimit ? config.paragraphsLimit.toString() : undefined;
}
function getQueryPrepend(config: Widget.SearchBoxConfig): string {
  return config.prependTheQuery && !!config.queryPrepend.trim() ? config.queryPrepend.trim() : '';
}
export function getJsonSchemaValue(config: Widget.ResultDisplayConfig) {
  if (config.jsonOutput && !!config.jsonSchema.trim()) {
    try {
      return JSON.stringify(JSON.parse(config.jsonSchema.trim())).replace(/'/g, '’');
    } catch (e) {
      console.warn(`Malformed JSON schema`, config.jsonSchema.trim());
    }
  }
  return undefined;
}
function getJsonSchema(config: Widget.ResultDisplayConfig): string {
  const schema = getJsonSchemaValue(config);
  return schema ? schema : '';
}
function getMetadata(config: Widget.ResultDisplayConfig): string {
  return config.displayMetadata && (config.metadatas || []).length > 0 ? (config.metadatas || []).join(',') : '';
}
function getWidgetTheme(options: Widget.WidgetConfiguration): string {
  return options.darkMode === 'dark' ? 'dark' : '';
}
function getReranker(config: Widget.SearchBoxConfig): string | undefined {
  return config.semanticReranking ? undefined : Reranker.NOOP;
}
function getRrfBoosting(config: Widget.SearchBoxConfig): string {
  return config.rrfBoosting && config.rrfSemanticBoosting !== undefined ? config.rrfSemanticBoosting.toString() : '';
}
function getCitationThreshold(config: Widget.ResultDisplayConfig): string | undefined {
  return config.showResultType === 'citations' && config.customizeThreshold
    ? config.citationThreshold.toString()
    : undefined;
}
