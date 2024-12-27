import { FullResourceStrategy, type RAGImageStrategy, RagImageStrategyName, RAGStrategy, RagStrategyName } from '../kb';

export function getRAGStrategies(ragStrategies: string): RAGStrategy[] {
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
        return { name, count: parseInt(rest[0], 10) };
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
  if (
    strategiesNames.includes(RagStrategyName.HIERARCHY) &&
    strategiesNames.includes(RagStrategyName.NEIGHBOURING_PARAGRAPHS)
  ) {
    console.error(
      `Incompatible RAG strategies: 'hierarchy' and 'neighbouring_paragraphs' strategies cannot be used simultaneously`,
    );
    return [];
  }
  return strategies;
}

export function getRAGImageStrategies(ragImageStrategies: string): RAGImageStrategy[] {
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

export interface WidgetFeatures {
  editLabels?: boolean;
  entityAnnotation?: boolean;
  filter?: boolean;
  navigateToFile?: boolean;
  navigateToLink?: boolean;
  notPublic?: boolean;
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
}

export type WidgetFeedback = 'none' | 'answer' | 'answerAndResults';
