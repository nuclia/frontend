import type { Classification, CloudLink, IResource, Paragraph, Search, WidgetFeatures } from '@nuclia/core';

export const NO_RESULTS: Search.Results = {
  resources: {} as { [id: string]: IResource },
  paragraphs: { results: [], facets: {}, total: 0, page_number: 0, next_page: false, page_size: 0 },
  sentences: { results: [], facets: {}, total: 0, page_number: 0, next_page: false, page_size: 0 },
  fulltext: { results: [], facets: {}, total: 0, page_number: 0, next_page: false, page_size: 0 },
};
export const PENDING_RESULTS = {
  ...NO_RESULTS,
  pending: true,
};

export interface WidgetOptions {
  fuzzyOnly?: boolean;
  highlight?: boolean;
  features?: WidgetFeatures;
}

export interface WidgetAction {
  label: string;
  destructive?: boolean;
  action: (uid: string) => void;
}

export interface DisplayedResource {
  uid: string;
  paragraph?: Search.Paragraph;
  sentence?: Search.Paragraph;
}

export enum FieldType {
  FILE = 'f',
  GENERIC = 'a',
  LINK = 'u',
  TEXT = 't',
}

export enum PreviewKind {
  NONE,
  PDF,
  VIDEO,
  AUDIO,
  YOUTUBE,
}

export enum SearchOrder {
  SEQUENTIAL,
  RELEVANCE,
}

interface BaseWidgetParagraph {
  fieldType: string;
  fieldId: string;
  paragraph: Paragraph;
  text: string;
  preview: PreviewKind;
  start: number;
  end: number;
}

export type WidgetParagraph = RegularWidgetParagraph | PdfWidgetParagraph | MediaWidgetParagraph;

export interface RegularWidgetParagraph extends BaseWidgetParagraph {
  fieldType: string;
  fieldId: string;
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
