import type {
  ExtractedDataTypes,
  FIELD_TYPE,
  FieldId,
  IFieldData,
  IResource,
  RelationEntityType,
  RelationType,
} from '../resource';
import type { ResourceProperties } from '../db.models';
import { RAGImageStrategy, RAGStrategy } from '../kb';

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

export enum FilterOperator {
  all = 'all',
  any = 'any',
  none = 'none',
  not_all = 'not_all',
}

export type Filter = {
  [operator in FilterOperator]?: string[];
};

export interface Prompts {
  system?: string;
  user?: string;
  rephrase?: string;
}

export interface MinScore {
  bm25?: number;
  semantic?: number;
}

export interface RankFusion {
  name: 'rrf';
  boosting: {
    semantic: number;
  };
}

export interface BaseSearchOptions {
  fields?: string[];
  filters?: string[] | Filter[];
  keyword_filters?: string[] | Filter[];
  min_score?: number | MinScore;
  range_creation_start?: string;
  range_creation_end?: string;
  range_modification_start?: string;
  range_modification_end?: string;
  show?: ResourceProperties[];
  /** @deprecated */
  extracted?: ExtractedDataTypes[];
  field_type_filter?: FIELD_TYPE[];
  resource_filters?: string[];
  autofilter?: boolean;
  highlight?: boolean;
  rephrase?: boolean;
  vectorset?: string;
  debug?: boolean;
  show_hidden?: boolean;
  audit_metadata?: { [key: string]: string };
  top_k?: number;
  reranker?: Reranker;
  rank_fusion?: RankFusion;
}

export interface ChatOptions extends BaseSearchOptions {
  synchronous?: boolean;
  prompt?: string | Prompts;
  /**
   * It will return the text blocks that have been effectively used to build each section of the answer.
   */
  citations?: boolean;
  rag_strategies?: RAGStrategy[];
  rag_images_strategies?: RAGImageStrategy[];
  generative_model?: string;
  /**
   * Defines the maximum number of tokens that the model will take as context.
   */
  max_tokens?: number | { context?: number; answer?: number };
  prefer_markdown?: boolean;
  answer_json_schema?: object;
  extra_context?: string[];
  citation_threshold?: number;
}

export interface SearchOptions extends BaseSearchOptions {
  faceted?: string[];
  sort?: SortOption;
  /**
   * @deprecated use top_k
   */
  page_number?: number;
  /**
   * @deprecated use top_k
   */
  page_size?: number;
  with_status?: ResourceStatus;
  with_duplicates?: boolean;
  with_synonyms?: boolean;
  rephrase_prompt?: string;
  /** Only for GET requests */
  min_score_bm25?: number;
  /** Only for GET requests */
  min_score_semantic?: number;
}

export interface CatalogOptions extends SearchOptions {
  hidden?: boolean;
  page_number?: number;
  page_size?: number;
}

export enum SHORT_FIELD_TYPE {
  text = 't',
  file = 'f',
  link = 'u',
  generic = 'a',
  conversation = 'c',
}

export enum Reranker {
  MULTI_MATCH_BOOSTER = 'multi_match_booster',
  PREDICT = 'predict',
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Search {
  export enum Features {
    KEYWORD = 'keyword',
    SEMANTIC = 'semantic',
    FULLTEXT = 'fulltext',
    RELATIONS = 'relations',
  }

  export enum ResourceFeatures {
    KEYWORD = 'keyword',
    SEMANTIC = 'semantic',
    RELATIONS = 'relations',
  }

  export enum SuggestionFeatures {
    PARAGRAPH = 'paragraph',
    ENTITIES = 'entities',
    INTENT = 'intent',
  }

  export interface FindResults {
    type: 'findResults';
    resources?: { [id: string]: FindResource };
    next_page: boolean;
    page_number: number;
    page_size: number;
    query: string;
    total: number;
    relations?: Relations;
    autofilters?: string[];
    searchId?: string;
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
    RERANKER = 'RERANKER',
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
    fuzzy_result: boolean;
    page_with_visual: boolean;
    is_a_table: boolean;
    reference: string;
  }

  export interface Results {
    type: 'searchResults';
    resources?: { [id: string]: IResource };
    sentences?: Sentences;
    paragraphs?: Paragraphs;
    fulltext?: Fulltext;
    relations?: Relations;
  }

  export interface Pagination {
    total: number;
    page_number: number;
    page_size: number;
    next_page: boolean;
  }

  export interface FieldResult extends IResource {
    paragraphs?: FindParagraph[];
    field?: FieldId;
    fieldData?: IFieldData;
  }

  export interface Suggestions {
    type: 'suggestions';
    paragraphs?: Paragraphs;
    entities?: EntitySuggestions;
  }

  export interface EntitySuggestions {
    total?: number;
    entities?: { value: string; family: string }[];
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
    [key: string]: {
      [value: string]: number;
    };
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
