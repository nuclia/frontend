import type { Search } from './search.models';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Ask {
  export interface Entry {
    question: string;
    answer: Answer;
  }

  export enum Features {
    PARAGRAPHS = 'paragraphs',
    RELATIONS = 'relations',
    VECTORS = 'vectors',
  }

  export interface Answer {
    type: 'answer';
    text: string;
    id: string;
    sources?: Search.FindResults;
    citations?: Citations;
    incomplete?: boolean;
    inError?: boolean;
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
      | MetadataAskResponseItem
      | CitationsAskResponseItem
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

  export interface MetadataAskResponseItem {
    type: 'metadata';
    tokens: AskTokens;
    timings: AskTimings;
  }

  export interface CitationsAskResponseItem {
    type: 'citations';
    citations: Citations;
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
    debug: { [key: string]: any };
  }

  export interface AskTokens {
    input: number;
    output: number;
  }

  export interface AskTimings {
    generative_first_chunk?: number;
    generative_total?: number;
  }

  export interface AskResponse {
    answer: string;
    status: string;
    retrieval_results: Search.FindResults;
    learning_id: string;
    relations: Search.Relations;
    citations: Citations;
    prompt_context?: string[];
    metadata: MetadataAskResponseItem;
  }
}

export interface Citations {
  [paragraphId: string]: [number, number][];
}
