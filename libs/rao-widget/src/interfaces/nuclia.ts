import type { AragAnswer } from '@nuclia/core';

export interface INuclia {
  auth?: {
    name?: string;
    preview_long?: string;
    preview_short?: string;
    readonly?: boolean;
  };
  options: {
    account: string;
    accountId: string;
    apiKey: string;
    backend: string;
    client: string;
    knowledgeBox: string;
    zone: string;
  };
  rest?: unknown;
  db?: unknown;
  events?: unknown;
}

export interface INucliaApiError {
  status: number;
  detail?: string;
}

export interface ISession {
  uuid: string;
  title?: string;
  summary?: string;
  created?: string;
  updated?: string;
  metadata?: Record<string, unknown>;
}

export interface ISessions {
  sessions: ISession[];
  pagination?: {
    next?: string;
    previous?: string;
    total?: number;
  };
}

export interface ISessionCreatePayload {
  slug: string;
  name: string;
  summary?: string;
  data?: string;
  format?: 'PLAIN' | 'HTML' | 'RST' | 'MARKDOWN' | 'JSON' | 'KEEP_MARKDOWN' | 'JSONL' | 'PLAIN_BLANKLINE_SPLIT';
}

export type RaoMessageRole = 'user' | 'assistant';

export type RaoMessageVariant = 'chip';

export interface IMessage {
  id: string;
  role: RaoMessageRole;
  content: string;
  meta?: string;
  title?: string;
  list?: string[];
  variant?: RaoMessageVariant;
  debug?: AragAnswer[];
}
