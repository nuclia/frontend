import type { Search } from './search.models';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Ask {
  export interface Entry {
    question: string;
    answer: Answer;
  }

  export enum Features {
    KEYWORD = 'keyword',
    SEMANTIC = 'semantic',
    RELATIONS = 'relations',
  }

  export interface Answer {
    type: 'answer';
    text: string;
    id: string;
    sources?: Search.FindResults;
    prequeries?: { [key: string]: Omit<Search.FindResults, 'type'> };
    citations?: Citations;
    jsonAnswer?: any;
    incomplete?: boolean;
    inError?: boolean;
    metadata?: { tokens?: AskTokens; timings?: AskTimings };
    promptContext?: string[];
  }

  export enum Author {
    USER = 'USER',
    NUCLIA = 'NUCLIA',
  }

  export interface ContextEntry {
    author: Author;
    text: string;
  }
  export interface AskResponseItem {
    item:
      | RetrievalAskResponseItem
      | AnswerAskResponseItem
      | AnswerJsonResponseItem
      | MetadataAskResponseItem
      | CitationsAskResponseItem
      | PrequeriesResponseItem
      | StatusAskResponseItem
      | ErrorAskResponseItem
      | RelationsAskResponseItem
      | DebugAskResponseItem;
  }

  export interface RetrievalAskResponseItem {
    type: 'retrieval';
    results: Search.FindResults;
  }

  export interface AnswerAskResponseItem {
    type: 'answer';
    text: string;
  }

  export interface AnswerJsonResponseItem {
    type: 'answer_json';
    object: any;
  }

  export interface MetadataAskResponseItem {
    type: 'metadata';
    tokens: AskTokens;
    timings: AskTimings;
  }

  export interface CitationsAskResponseItem {
    type: 'citations';
    citations: Citations;
  }

  export interface PrequeriesResponseItem {
    type: 'prequeries';
    results: { [key: string]: Omit<Search.FindResults, 'type'> };
  }

  export interface StatusAskResponseItem {
    type: 'status';
    code: string;
    status: string;
    details?: string;
  }

  export interface ErrorAskResponseItem {
    type: 'error';
    error: string;
  }

  export interface RelationsAskResponseItem {
    type: 'relations';
    relations: Search.Relations;
  }

  export interface DebugAskResponseItem {
    type: 'debug';
    metadata: { [key: string]: any };
  }

  export interface AskTokens {
    input: number;
    output: number;
    input_nuclia: number;
    output_nuclia: number;
  }

  export interface AskTimings {
    generative_first_chunk?: number;
    generative_total?: number;
  }

  export interface AskResponse {
    answer: string;
    status: string;
    retrieval_results: Search.FindResults;
    retrieval_best_matches: string[];
    prequeries: { [key: string]: Omit<Search.FindResults, 'type'> };
    learning_id: string;
    relations: Search.Relations;
    citations: Citations;
    prompt_context?: string[];
    metadata: MetadataAskResponseItem;
    answer_json?: any;
    error_details?: string;
  }

  export interface PredictAnswerResponseItem {
    chunk: TextPredictAnswerResponseItem | StatusPredictAnswerResponseItem | JsonPredictAnswerResponseItem;
  }

  export interface TextPredictAnswerResponseItem {
    type: 'text';
    text: string;
  }

  export interface StatusPredictAnswerResponseItem {
    type: 'status';
    code: string;
  }

  export interface JsonPredictAnswerResponseItem {
    type: 'object';
    object: any;
  }
}

export interface Citations {
  [paragraphId: string]: [number, number][];
}

export interface PredictAnswerOptions {
  retrieval?: boolean;
  system?: string;
  chat_history?: Ask.ContextEntry[];
  context?: Ask.ContextEntry[];
  query_context?: string[] | { [key: string]: string };
  query_context_order?: { [key: string]: number };
  truncate?: boolean;
  user_prompt?: { prompt: string };
  citations?: boolean;
  citation_threshold?: number;
  generative_model?: string;
  max_tokens?: number;
  query_context_images?: {
    content_type: string;
    b64encoded: string;
  };
  prefer_markdown?: boolean;
  json_schema?: object;
  format_prompt?: boolean;
  rerank_context?: boolean;
}
