import type { FieldFullId, MediaWidgetParagraph, PreviewKind } from '../models';
import { SvelteState } from '../state-lib';
import type { IFieldData } from '@nuclia/core';
import { FIELD_TYPE, FileFieldData, LinkFieldData, sliceUnicode } from '@nuclia/core';
import { getFileUrls } from '../api';
import { filter, map, Observable, of, switchMap } from 'rxjs';
import { NEWLINE_REGEX } from '../utils';

interface ViewerState {
  fieldFullId: FieldFullId | null;
  fieldData: IFieldData | null;
  title: string;
}

export const viewerState = new SvelteState<ViewerState>({
  fieldFullId: null,
  fieldData: null,
  title: '',
});

export const fieldFullId = viewerState.writer<FieldFullId | null, FieldFullId | null>(
  (state) => state.fieldFullId,
  (state, fieldFullId) => ({
    ...state,
    fieldFullId,
  }),
);

export const fieldData = viewerState.writer<IFieldData | null, IFieldData | null>(
  (state) => state.fieldData,
  (state, fieldData) => ({
    ...state,
    fieldData: fieldData
      ? {
          value: fieldData.value,
          extracted: fieldData.extracted,
        }
      : null,
  }),
);

export const resourceTitle = viewerState.writer<string, string>(
  (state) => state.title,
  (state, title) => ({
    ...state,
    title,
  }),
);

export const fieldType = viewerState.reader<FIELD_TYPE | null>((state) => state.fieldFullId?.field_type || null);

export function getFieldUrl(): Observable<string> {
  return viewerState.store.pipe(
    switchMap((state) => {
      if (!state.fieldFullId || !state.fieldData) {
        return of(['']);
      } else if (state.fieldFullId.field_type === FIELD_TYPE.file) {
        const uri = (state.fieldData as FileFieldData)?.value?.file?.uri;
        return uri ? getFileUrls([uri]) : of(['']);
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

export function getFieldSummary(): Observable<string> {
  return fieldData.pipe(map((data) => data?.extracted?.metadata?.metadata?.summary || ''));
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
