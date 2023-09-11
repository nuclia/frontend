import type { Search } from './search.models';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Chat {
  export interface Entry {
    question: string;
    answer: Answer;
  }

  export enum Features {
    PARAGRAPHS = 'paragraphs',
    RELATIONS = 'relations',
  }

  export interface Answer {
    type: 'answer';
    text: string;
    id: string;
    sources?: Search.FindResults;
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
}
