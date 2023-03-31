import type { ExtractedDataTypes, ResourceProperties } from '../kb';
import type { FIELD_TYPE, FieldId, IFieldData, IResource, RelationEntityType, RelationType } from '../resource';

export type ResourceStatus = 'PENDING' | 'PROCESSED' | 'ERROR';

export type SortOrder = 'asc' | 'desc';

export enum SortField {
  created = 'created',
  modified = 'modified',
  title = 'title',
}

export interface SortOption {
  field: SortField;
  limit?: number;
  order?: SortOrder;
}

export interface SearchOptions {
  // non API-official options
  inTitleOnly?: boolean;
  isAdvanced?: boolean;

  // API options
  highlight?: boolean;
  faceted?: string[];
  filters?: string[];
  fields?: string[];
  sort?: SortOption;
  page_number?: number;
  page_size?: number;
  min_score?: number;
  range_creation_start?: string;
  range_creation_end?: string;
  range_modification_start?: string;
  range_modification_end?: string;
  show?: ResourceProperties[];
  extracted?: ExtractedDataTypes[];
  field_type?: FIELD_TYPE[];
  shards?: string[];
  with_status?: ResourceStatus;
  with_duplicates?: boolean;
  with_synonyms?: boolean;
}

export enum SHORT_FIELD_TYPE {
  layout = 'l',
  text = 't',
  file = 'f',
  link = 'u',
  datetime = 'd',
  keywordset = 'k',
  generic = 'a',
  conversation = 'c',
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

  export interface FindResults {
    error?: boolean;
    resources?: { [id: string]: FindResource };
    shards?: string[];
    next_page: boolean;
    page_number: number;
    page_size: number;
    query: string;
    total: number;
    relations?: Relations;
  }

  export interface FindResource extends IResource {
    fields: { [id: string]: FindField };
  }

  export interface FindField {
    paragraphs: { [id: string]: FindParagraph };
  }

  export enum FindScoreType {
    VECTOR = 'VECTOR',
    BM25 = 'BM25',
    BOTH = 'BOTH',
  }

  export interface FindParagraph {
    order: number;
    score: number;
    score_type: FindScoreType;
    text: string;
    id: string;
    labels: string[];
    position: {
      index: number;
      start: number;
      end: number;
      start_seconds?: number[];
      end_seconds?: number[];
      page_number?: number;
    };
  }

  export interface Results {
    error?: boolean;
    resources?: { [id: string]: IResource };
    sentences?: Sentences;
    paragraphs?: Paragraphs;
    fulltext?: Fulltext;
    relations?: Relations;
    shards?: string[];
  }

  export interface Pagination {
    total: number;
    page_number: number;
    page_size: number;
    next_page: boolean;
  }

  export interface SmartResult extends IResource {
    paragraphs?: FindParagraph[];
    field?: FieldId;
    fieldData?: IFieldData;
  }

  export interface SmartParagraph extends Paragraph {
    sentences?: Sentence[];
  }

  export interface Suggestions {
    error?: boolean;
    paragraphs?: Paragraphs;
  }

  export interface Sentences extends Pagination {
    results: Sentence[];
    facets: FacetsResult;
  }

  export interface Fulltext extends Pagination {
    results: FulltextResource[];
    facets: FacetsResult;
  }

  export interface Paragraphs extends Pagination {
    results: Paragraph[];
    facets: FacetsResult;
  }

  export interface Relations {
    entities: {
      [key: string]: {
        related_to: Relation[];
      };
    };
  }

  export interface Relation {
    entity: string;
    entity_type: RelationEntityType;
    relation: RelationType;
    relation_label: string;
    direction: 'in' | 'out';
  }

  export interface FacetsResult {
    [key: string]: any;
  }

  export interface Paragraph {
    order: number;
    score: number;
    rid: string;
    field_type: SHORT_FIELD_TYPE;
    field: string;
    text: string;
    labels: string[];
    start_seconds?: number[];
    end_seconds?: number[];
    position?: { page_number: number; start: number; end: number; index: number };
  }

  export interface Sentence {
    score: number;
    rid: string;
    field_type: SHORT_FIELD_TYPE;
    field: string;
    text: string;
    position?: { page_number?: number; start: number; end: number; index: number };
  }

  export interface FulltextResource {
    score: number;
    rid: string;
    field_type: string;
    field: string;
  }
}
