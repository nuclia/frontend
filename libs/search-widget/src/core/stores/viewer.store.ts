import type { FieldFullId, MediaWidgetParagraph, PreviewKind } from '../models';
import { SvelteState } from '../state-lib';
import type { IFieldData, ResourceField } from '@nuclia/core';
import { FIELD_TYPE, FileFieldData, LinkFieldData, sliceUnicode } from '@nuclia/core';
import { getFileUrls } from '../api';
import { filter, map, Observable, of, switchMap } from 'rxjs';
import { NEWLINE_REGEX } from '../utils';

interface ViewerState {
  fieldFullId: FieldFullId | null;
  fieldData: IFieldData | null;
  title: string;
  summary: string;
  isPreviewing: boolean;
}

export const viewerState = new SvelteState<ViewerState>({
  fieldFullId: null,
  fieldData: null,
  title: '',
  summary: '',
  isPreviewing: false,
});

export const isPreviewing = viewerState.writer(
  (state) => state.isPreviewing,
  (state, isPreviewing) => ({ ...state, isPreviewing }),
);

export const fieldFullId = viewerState.writer<FieldFullId | null, FieldFullId | null>(
  (state) => state.fieldFullId,
  (state, fieldFullId) => ({
    ...state,
    fieldFullId,
  }),
);

export const fieldData = viewerState.writer<IFieldData | null, IFieldData | null>(
  (state) => state.fieldData,
  (state, data) => {
    return {
      ...state,
      fieldData: data
        ? {
            value: data.value,
            extracted: data.extracted,
          }
        : null,
      summary: data?.extracted?.metadata?.metadata?.summary || '',
    };
  },
);

export const resourceField = viewerState.reader<ResourceField | null>((state) =>
  state.fieldData && state.fieldFullId ? { ...state.fieldData, ...state.fieldFullId } : null,
);

export const resourceTitle = viewerState.writer<string, string>(
  (state) => state.title,
  (state, title) => ({
    ...state,
    title,
  }),
);

export const fieldSummary = viewerState.reader<string>((state) => state.summary);

export const fieldType = viewerState.reader<FIELD_TYPE | null>((state) => state.fieldFullId?.field_type || null);

export function getFieldUrl(forcePdf?: boolean): Observable<string> {
  return viewerState.store.pipe(
    switchMap((state) => {
      if (!state.fieldFullId || !state.fieldData) {
        return of(['']);
      } else if (state.fieldFullId.field_type === FIELD_TYPE.file) {
        if (forcePdf && !(state.fieldData as FileFieldData)?.value?.file?.content_type?.includes('pdf')) {
          const pdfPreview = (state.fieldData as FileFieldData).extracted?.file?.file_preview;
          return pdfPreview?.uri ? getFileUrls([pdfPreview.uri]) : of(['']);
        } else {
          const uri = (state.fieldData as FileFieldData)?.value?.file?.uri;
          return uri ? getFileUrls([uri]) : of(['']);
        }
      } else if (state.fieldFullId.field_type === FIELD_TYPE.link) {
        return of([(state.fieldData as LinkFieldData)?.value?.uri || '']);
      } else {
        return of(['']);
      }
    }),
    map((urls) => urls[0]),
  );
}

export function isLinkField(): Observable<boolean> {
  return fieldFullId.pipe(map((fullId) => fullId?.field_type === FIELD_TYPE.link));
}

export function getMediaTranscripts(
  kind: PreviewKind.VIDEO | PreviewKind.AUDIO | PreviewKind.YOUTUBE,
): Observable<MediaWidgetParagraph[]> {
  return viewerState.store.pipe(
    map((state) => {
      if (!state.fieldFullId || !state.fieldData) {
        return [];
      } else {
        const fullId = state.fieldFullId;
        const text = state.fieldData.extracted?.text?.text || '';
        return (state.fieldData.extracted?.metadata?.metadata?.paragraphs || []).map((paragraph) => {
          const paragraphText = sliceUnicode(text, paragraph.start, paragraph.end).trim();
          return {
            paragraph,
            text: paragraphText.trim().replace(NEWLINE_REGEX, '<br>'),
            fieldType: fullId.field_type,
            fieldId: fullId.field_id,
            preview: kind,
            start: paragraph.start || 0,
            end: paragraph.end || 0,
            start_seconds: paragraph.start_seconds?.[0] || 0,
            end_seconds: paragraph.end_seconds?.[0] || 0,
          };
        });
      }
    }),
  );
}

export function getFileFieldContentType(): Observable<string> {
  return viewerState.store.pipe(
    filter((state) => !!state.fieldFullId && state.fieldFullId.field_type === FIELD_TYPE.file && !!state.fieldData),
    map((state) => (state.fieldData as FileFieldData).value?.file?.content_type || ''),
  );
}
