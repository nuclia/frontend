import type { IResource } from './resource.models';

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
    // fulltext: Optional[Resources] = None
    // relations: Optional[Relations] = None
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
  }

  export interface Sentence {
    score: number;
    rid: string;
    text: string;
  }
}
