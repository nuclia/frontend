import type { FieldFullId, Search, WidgetFeatures } from '@nuclia/core';

export type ResultType = 'pdf' | 'video' | 'audio' | 'image' | 'spreadsheet' | 'conversation' | 'text';

type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U;
export interface RankedParagraph extends Search.FindParagraph {
  rank?: number;
}
export type RankedFieldResult = Overwrite<Search.FieldResult, { paragraphs: RankedParagraph[] }> & { ranks?: number[] };

export interface TypedResult extends RankedFieldResult {
  resultType: ResultType;
  resultIcon: string;
}

export interface FindResultsAsList extends Omit<Search.FindResults, 'resources'> {
  resultList: TypedResult[];
}

const EMPTY_FIND_RESULTS: Omit<Search.FindResults, 'resources'> = {
  type: 'findResults',
  total: 0,
  page_number: 0,
  next_page: false,
  page_size: 0,
  query: '',
};

export const NO_RESULTS: Search.FindResults = {
  ...EMPTY_FIND_RESULTS,
  resources: {},
};

export const NO_RESULT_LIST: FindResultsAsList = {
  ...EMPTY_FIND_RESULTS,
  resultList: [],
};

export const NO_SUGGESTION_RESULTS: Search.Suggestions = {
  type: 'suggestions',
  paragraphs: {} as Search.Paragraphs,
};

export interface WidgetOptions {
  fuzzyOnly?: boolean;
  highlight?: boolean;
  features?: WidgetFeatures;
  prompt?: string;
  system_prompt?: string;
  rephrase_prompt?: string;
  generative_model?: string;
  vectorset?: string;
  ask_to_resource?: string;
  max_tokens?: number;
  max_output_tokens?: number;
  max_paragraphs?: number;
  query_prepend?: string;
  audit_metadata?: string;
}

export interface WidgetAction {
  label: string;
  destructive?: boolean;
  action: (fullId: FieldFullId) => void;
}

export interface EntityGroup {
  id: string;
  title?: string;
  color?: string;
  custom?: boolean;
  entities?: string[];
}

export type FilterType = 'labels' | 'entities' | 'created' | 'labelFamilies';
export interface WidgetFilters {
  labels?: boolean;
  entities?: boolean;
  created?: boolean;
  labelFamilies?: boolean;
}

export interface JsonSchema {
  name: string;
  description: string;
  parameters: JsonSchemaObject;
}
export type JsonSchemaType = 'object' | 'string' | 'array' | 'number' | 'boolean';

export interface JsonSchemaBase {
  type: JsonSchemaType;
  description?: string;
}

export interface JsonSchemaObject extends JsonSchemaBase {
  type: 'object';
  properties: {
    [key: string]: JsonSchemaBase;
  };
  required?: string[];
}
export interface JsonSchemaArray extends JsonSchemaBase {
  type: 'array';
  items: {
    type: JsonSchemaType;
  };
}
