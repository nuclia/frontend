import type { MediaWidgetParagraph, PreviewKind, ResultType, TypedResult } from '../models';
import { SvelteState } from '../state-lib';
import type { CloudLink, FieldFullId, IFieldData } from '@nuclia/core';
import {
  FIELD_TYPE,
  FieldMetadata,
  FileFieldData,
  LinkFieldData,
  longToShortFieldType,
  Search,
  sliceUnicode,
} from '@nuclia/core';
import { getFileUrls } from '../api';
import type { Observable } from 'rxjs';
import { filter, map, of, switchMap, take } from 'rxjs';
import { NEWLINE_REGEX } from '../utils';

export interface ViewerState {
  currentResult: TypedResult | null;
  selectedParagraphIndex: number;
  playFromTranscript: boolean;
  summary: string;
  isPreviewing: boolean;
  fieldFullId: FieldFullId | null;
  transcripts: Search.FindParagraph[];
  fullMetadataLoaded: boolean;

  // Viewer internal search
  query: string | null;
  searchInFieldResults: Search.FindParagraph[] | null;
  hasError: boolean;
}

export const viewerState = new SvelteState<ViewerState>({
  currentResult: null,
  selectedParagraphIndex: -1,
  playFromTranscript: false,
  summary: '',
  isPreviewing: false,
  fieldFullId: null,
  transcripts: [],
  fullMetadataLoaded: false,

  query: null,
  searchInFieldResults: null,
  hasError: false,
});

export interface ViewerBasicSetter {
  result: TypedResult | null;
  selectedParagraphIndex: number;
}

export const viewerData = viewerState.writer<ViewerState, ViewerBasicSetter>(
  (state) => state,
  (state, data) => ({
    ...state,
    currentResult: data.result
      ? {
          ...data.result,
          paragraphs: data.result.paragraphs || [],
        }
      : null,
    selectedParagraphIndex: data.selectedParagraphIndex,
    fieldFullId:
      data.result && data.result.field
        ? { field_id: data.result.field.field_id, field_type: data.result.field.field_type, resourceId: data.result.id }
        : null,
    isPreviewing: !!data,
    searchInFieldResults: null,
    fullMetadataLoaded: false,
  }),
);

export const searchInFieldQuery = viewerState.writer<string | null, string>(
  (state) => state.query,
  (state, query) => {
    const trimmedQuery = query.trim();
    if (trimmedQuery !== state.query) {
      return {
        ...state,
        query: trimmedQuery,
        hasError: false,
      };
    }
    return state;
  },
);

export const searchInFieldResults = viewerState.writer<Search.FindParagraph[] | null>(
  (state) => state.searchInFieldResults,
  (state, results) => ({
    ...state,
    searchInFieldResults: results,
    selectedParagraphIndex: -1,
  }),
);

export const resetSearchInField = viewerState.action((state) => ({
  ...state,
  searchInFieldResults: null,
  query: null,
  selectedParagraphIndex: -1,
  playFromTranscripts: false,
}));

export const hasViewerSearchError = viewerState.writer<boolean>(
  (state) => state.hasError,
  (state, hasError) => ({
    ...state,
    hasError,
  }),
);

export const isPreviewing = viewerState.writer<boolean>(
  (state) => state.isPreviewing,
  (state, isPreviewing) => ({ ...state, isPreviewing }),
);

export const selectedParagraphIndex = viewerState.writer<
  number | null,
  { index: number; playFromTranscripts: boolean }
>(
  (state) => state.selectedParagraphIndex,
  (state, payload) => ({
    ...state,
    selectedParagraphIndex: payload.index,
    playFromTranscript: payload.playFromTranscripts,
  }),
);

export const selectedParagraph = viewerState.reader<Search.FindParagraph | null>((state) => {
  if (state.selectedParagraphIndex !== null) {
    if (!!state.searchInFieldResults) {
      return state.searchInFieldResults[state.selectedParagraphIndex];
    }
    if (state.currentResult && state.currentResult.paragraphs) {
      return state.currentResult.paragraphs[state.selectedParagraphIndex];
    }
  }

  return null;
});

export const selectPrevious = viewerState.action((state) => {
  if (state.selectedParagraphIndex !== null && state.selectedParagraphIndex > 0) {
    return {
      ...state,
      selectedParagraphIndex: state.selectedParagraphIndex - 1,
      playFromTranscript: false,
    };
  }
  return state;
});

export const selectNext = viewerState.action((state) => {
  if (!state.currentResult?.paragraphs) {
    return state;
  }

  // when we played from transcript previously, the selectedParagraphIndex on result navigator is set to 0,
  // so next search result is always the first one in this case
  if (state.playFromTranscript) {
    return {
      ...state,
      selectedParagraphIndex: 0,
      playFromTranscript: false,
    };
  }

  // otherwise, we increment selectedParagraphIndex in the limit of paragraphs count
  if (
    state.selectedParagraphIndex !== null &&
    state.selectedParagraphIndex < state.currentResult.paragraphs.length - 1
  ) {
    return {
      ...state,
      selectedParagraphIndex: state.selectedParagraphIndex + 1,
      playFromTranscript: false,
    };
  }
  return state;
});

export const currentResultType = viewerState.reader<ResultType | null>(
  (state) => state.currentResult?.resultType || null,
);
export const currentThumbnail = viewerState.reader<string | null>((state) => state.currentResult?.thumbnail || null);

export const playFrom = viewerState.reader<number>((state) => {
  if (
    state.selectedParagraphIndex === null ||
    (state.playFromTranscript && state.transcripts.length === 0) ||
    (!state.playFromTranscript && (!state.currentResult?.paragraphs || state.currentResult.paragraphs.length === 0))
  ) {
    return 0;
  }
  const paragraphs: Search.FindParagraph[] = state.playFromTranscript
    ? state.transcripts
    : (state.currentResult?.paragraphs as Search.FindParagraph[]);
  const selectedParagraph = paragraphs[state.selectedParagraphIndex];
  return selectedParagraph.position.start_seconds?.[0] || 0;
});

export const fieldFullId = viewerState.writer<FieldFullId | null, FieldFullId | null>(
  (state) => state.fieldFullId,
  (state, fieldFullId) => ({
    ...state,
    fieldFullId,
  }),
);

export const fieldData = viewerState.writer<IFieldData | null, IFieldData | null>(
  (state) => state.currentResult?.fieldData || null,
  (state, data) => {
    let fieldData: IFieldData | undefined;
    if (data) {
      fieldData = {
        value: data.value,
        extracted: data.extracted,
      };
    }
    const currentResult: TypedResult | null = state.currentResult
      ? {
          ...state.currentResult,
          fieldData,
        }
      : null;
    return {
      ...state,
      currentResult,
      summary: data?.extracted?.metadata?.metadata?.summary?.trim() || '',
    };
  },
);

export const fullMetadataLoaded = viewerState.reader<boolean>((state) => state.fullMetadataLoaded);

export const fieldMetadata = viewerState.writer<FieldMetadata | undefined, FieldMetadata>(
  (state) => state.currentResult?.fieldData?.extracted?.metadata?.metadata,
  (state, metadata) =>
    state.currentResult?.fieldData?.extracted?.metadata?.metadata
      ? {
          ...state,
          currentResult: {
            ...state.currentResult,
            fieldData: {
              ...state.currentResult.fieldData,
              extracted: {
                ...state.currentResult.fieldData.extracted,
                metadata: {
                  ...state.currentResult.fieldData.extracted.metadata,
                  metadata,
                },
              },
            },
          },
          fullMetadataLoaded: true,
        }
      : state,
);

export const transcripts = viewerState.writer<Search.FindParagraph[]>(
  (state) => state.transcripts,
  (state, transcripts) => ({
    ...state,
    transcripts,
  }),
);

export const fieldSummary = viewerState.reader<string>((state) => state.summary);

export const fieldType = viewerState.reader<FIELD_TYPE | null>((state) => state.fieldFullId?.field_type || null);

export function getFieldUrl(forcePdf?: boolean): Observable<string> {
  return viewerState.store.pipe(
    switchMap((state) => {
      if (!state.fieldFullId || !state.currentResult?.fieldData) {
        return of(['']);
      } else if (state.fieldFullId.field_type === FIELD_TYPE.file) {
        if (forcePdf && !(state.currentResult.fieldData as FileFieldData)?.value?.file?.content_type?.includes('pdf')) {
          const pdfPreview = (state.currentResult.fieldData as FileFieldData).extracted?.file?.file_preview;
          return pdfPreview?.uri ? getFileUrls([pdfPreview.uri]) : of(['']);
        } else {
          const uri = (state.currentResult.fieldData as FileFieldData)?.value?.file?.uri;
          return uri ? getFileUrls([uri]) : of(['']);
        }
      } else if (state.fieldFullId.field_type === FIELD_TYPE.link) {
        return of([(state.currentResult.fieldData as LinkFieldData)?.value?.uri || '']);
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

export function loadTranscripts() {
  viewerState.store
    .pipe(
      take(1),
      map((state) => {
        if (!state.fieldFullId || !state.currentResult?.fieldData) {
          return [];
        } else {
          const text = state.currentResult.fieldData.extracted?.text?.text || '';
          const paragraphs = (state.currentResult.fieldData.extracted?.metadata?.metadata?.paragraphs || []).filter(
            (paragraph) => paragraph.kind === 'TRANSCRIPT',
          );
          const fieldFullId = state.fieldFullId;
          return paragraphs.map((paragraph, index) => {
            const paragraphText = sliceUnicode(text, paragraph.start, paragraph.end).trim();
            const start = paragraph.start || 0;
            const end = paragraph.end || 0;
            const id = `${fieldFullId.resourceId}/${longToShortFieldType(fieldFullId.field_type)}/${
              fieldFullId.field_id
            }/${start}-${end}`;
            return {
              id,
              order: paragraph.order || 0,
              text: paragraphText,
              labels: [],
              score: 0,
              score_type: Search.FindScoreType.BOTH,
              position: {
                index,
                start,
                end,
                start_seconds: paragraph.start_seconds,
                end_seconds: paragraph.end_seconds,
              },
            };
          });
        }
      }),
    )
    .subscribe((transcriptList) => transcripts.set(transcriptList));
}

export function getMediaTranscripts(
  kind: PreviewKind.VIDEO | PreviewKind.AUDIO | PreviewKind.YOUTUBE,
): Observable<MediaWidgetParagraph[]> {
  return viewerState.store.pipe(
    map((state) => {
      if (!state.fieldFullId || !state.currentResult?.fieldData) {
        return [];
      } else {
        const fullId = state.fieldFullId;
        const text = state.currentResult.fieldData.extracted?.text?.text || '';
        const paragraphs = (state.currentResult.fieldData.extracted?.metadata?.metadata?.paragraphs || []).filter(
          (paragraph) => paragraph.kind === 'TRANSCRIPT',
        );
        return paragraphs.map((paragraph) => {
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

export function getPlayableVideo(): Observable<CloudLink | undefined> {
  return viewerState.store.pipe(
    filter((state) => !!state.currentResult?.fieldData?.extracted),
    map((state) => {
      const data = state.currentResult?.fieldData as FileFieldData;
      return data?.extracted?.file?.file_generated?.['video.mpd'] || data?.value?.file;
    }),
  );
}
