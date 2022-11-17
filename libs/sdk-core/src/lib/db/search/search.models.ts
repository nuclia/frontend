import type { ExtractedDataTypes, ResourceProperties } from '../kb';
import type { FIELD_TYPE, IResource } from '../resource';

export interface SearchOptions {
  // non API-official options
  inTitleOnly?: boolean;

  // API options
  highlight?: boolean;
  faceted?: string[];
  filters?: string[];
  sort?: 'created' | 'modified';
  page_number?: number;
  page_size?: number;
  max_score?: number;
  range_creation_start?: string;
  range_creation_end?: string;
  range_modification_start?: string;
  range_modification_end?: string;
  show?: ResourceProperties[];
  extracted?: ExtractedDataTypes[];
  field_type?: FIELD_TYPE[];
  shards?: string[];
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Search {
  export enum Features {
    PARAGRAPH = 'paragraph',
    DOCUMENT = 'document',
    RELATIONS = 'relations',
    VECTOR = 'vector',
  }

  export enum ResourceFeatures {
    PARAGRAPH = 'paragraph',
    RELATIONS = 'relations',
    VECTOR = 'vector',
  }

  export interface Results {
    error?: boolean;
    resources?: { [id: string]: IResource };
    sentences?: Sentences;
    paragraphs?: Paragraphs;
    shards?: string[];
    fulltext?: IResource[];
  }

  export interface Suggestions {
    error?: boolean;
    paragraphs?: Paragraphs;
  }

  export interface Sentences {
    results: Sentence[];
    facets: FacetsResult;
  }

  export interface Paragraphs {
    results: Paragraph[];
    facets: FacetsResult;
  }

  export interface FacetsResult {
    [key: string]: {
      tag: string;
      total: number;
    };
  }

  export interface Paragraph {
    score: number;
    rid: string;
    field_type: string;
    field: string;
    text: string;
    labels: string[];
    position: { page_number: number; start: number; end: number; index: number };
  }

  export interface Sentence {
    score: number;
    rid: string;
    field_type: string;
    field: string;
    text: string;
  }
}
