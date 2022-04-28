import type { Paragraph, CloudLink, Search } from '@nuclia/core';

export const NO_RESULTS = {
  resources: {},
  paragraphs: { results: [], facets: {} },
};
export const PENDING_RESULTS = {
  resources: {},
  paragraphs: { results: [], facets: {} },
  pending: true,
};

export interface WidgetAction {
  label: string;
  action: (uid: string) => void;
}

export interface DisplayedResource {
  uid: string;
  paragraph?: Search.Paragraph;
}

export enum PreviewKind {
  NONE,
  PDF,
  VIDEO,
  AUDIO,
}

interface BaseWidgetParagraph {
  fieldType: string;
  fieldId: string;
  text: string;
  preview: PreviewKind;
}

export type WidgetParagraph = RegularWidgetParagraph | PdfWidgetParagraph | MediaWidgetParagraph;

export interface RegularWidgetParagraph extends BaseWidgetParagraph {
  fieldType: string;
  fieldId: string;
  preview: PreviewKind.NONE;
}

export interface PdfWidgetParagraph extends BaseWidgetParagraph {
  paragraph: Paragraph;
  page: number;
  preview: PreviewKind.PDF;
}

export interface MediaWidgetParagraph extends BaseWidgetParagraph {
  paragraph: Paragraph;
  time: number;
  preview: PreviewKind.VIDEO | PreviewKind.AUDIO;
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

export interface LinkPreviewParams {
  file: CloudLink;
}
