import { Ask, ChatOptions } from '@nuclia/core';

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
  tokens?: Ask.AskTokens;
  timings?: Ask.AskTimings;
}
