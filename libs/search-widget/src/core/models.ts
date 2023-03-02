import type {
  Classification,
  CloudLink,
  FIELD_TYPE,
  FieldId,
  IResource,
  Paragraph,
  Search,
  SHORT_FIELD_TYPE,
  WidgetFeatures,
} from '@nuclia/core';

export const NO_RESULTS: Search.Results = {
  resources: {} as { [id: string]: IResource },
  paragraphs: { results: [], facets: {}, total: 0, page_number: 0, next_page: false, page_size: 0 },
  sentences: { results: [], facets: {}, total: 0, page_number: 0, next_page: false, page_size: 0 },
  fulltext: { results: [], facets: {}, total: 0, page_number: 0, next_page: false, page_size: 0 },
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

export interface FieldFullId extends FieldId {
  resourceId: string;
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
