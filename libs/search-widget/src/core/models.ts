import type {
  Classification,
  CloudLink,
  FIELD_TYPE,
  FieldFullId,
  Paragraph,
  Search,
  SHORT_FIELD_TYPE,
  WidgetFeatures,
} from '@nuclia/core';

export type ResultType = 'pdf' | 'video' | 'audio' | 'image' | 'spreadsheet' | 'conversation' | 'text';
export interface TypedResult extends Search.FieldResult {
  resultType: ResultType;
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
}

export interface WidgetAction {
  label: string;
  destructive?: boolean;
  action: (fullId: FieldFullId) => void;
}

/**
 * @deprecated This interface was used for the previous viewer implementation
 */
export interface DisplayedResource {
  uid: string;
  paragraph?: Search.Paragraph;
  sentence?: Search.Paragraph;
}

export enum PreviewKind {
  NONE,
  PDF,
  VIDEO,
  AUDIO,
  YOUTUBE,
  IMAGE,
}

export enum SearchOrder {
  SEQUENTIAL,
  RELEVANCE,
}

interface BaseWidgetParagraph {
  fieldType: SHORT_FIELD_TYPE | FIELD_TYPE;
  fieldId: string;
  paragraph: Paragraph;
  text: string;
  preview: PreviewKind;
  start: number;
  end: number;
}

export type WidgetParagraph = RegularWidgetParagraph | PdfWidgetParagraph | MediaWidgetParagraph;

export interface RegularWidgetParagraph extends BaseWidgetParagraph {
  preview: PreviewKind.NONE;
}

export interface PdfWidgetParagraph extends BaseWidgetParagraph {
  page: number;
  preview: PreviewKind.PDF;
}

export interface MediaWidgetParagraph extends BaseWidgetParagraph {
  start_seconds: number;
  end_seconds: number;
  preview: PreviewKind.VIDEO | PreviewKind.AUDIO | PreviewKind.YOUTUBE;
}

export interface SelectedParagraph {
  fieldType: string;
  fieldId: string;
  paragraph: Paragraph;
}

export interface PdfPreviewParams {
  page: number;
  total: number;
  query?: string;
}

export interface MediaPreviewParams {
  file: CloudLink;
  time: number;
}

export interface YoutubePreviewParams {
  uri: string;
  time: number;
}

export interface LinkPreviewParams {
  file: CloudLink;
}

export interface EntityGroup {
  id: string;
  title?: string;
  color?: string;
  custom?: boolean;
  entities: string[];
}

export interface ParagraphLabels {
  labels: Classification[];
  annotatedLabels: Classification[];
}
