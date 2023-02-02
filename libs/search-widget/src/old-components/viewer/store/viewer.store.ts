import type {
  Classification,
  CloudLink,
  FileFieldData,
  IFieldData,
  Paragraph,
  PositionedNER,
  Resource,
  ResourceData,
} from '@nuclia/core';
import { FIELD_TYPE, RESOURCE_STATUS, Search, SHORT_FIELD_TYPE } from '@nuclia/core';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  merge,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  take,
  tap,
} from 'rxjs';
import type {
  LinkPreviewParams,
  MediaPreviewParams,
  ParagraphLabels,
  PdfPreviewParams,
  SelectedParagraph,
  WidgetParagraph,
  YoutubePreviewParams,
} from '../../../core/models';
import { PreviewKind } from '../../../core/models';
import { getFileUrls, setLabels } from '../../../core/api';
import { resource } from '../../../core/stores/resource.store';
import { hasViewerSearchError, viewerSearchQuery, viewerSearchResults } from '../../../core/stores/viewer-search.store';
import {
  getFields,
  getFieldType,
  getFileField,
  getLinkField,
  getParagraphId,
  getVideoStream,
  NEWLINE_REGEX,
} from '../../../core/utils';

type ViewerStore = {
  showPreview: BehaviorSubject<boolean>;
  selectedParagraph: BehaviorSubject<SelectedParagraph | null>;
  onlySelected: BehaviorSubject<boolean>;
  setPage: Subject<number>;
  linkPreview: BehaviorSubject<LinkPreviewParams | null>;
  savingLabels: BehaviorSubject<boolean>;
  updatedLabels: Subject<{ [key: string]: Classification[] }>;
  currentField: BehaviorSubject<{ field_type: string; field_id: string } | null>;
  init: () => void;
};

export const viewerStore: ViewerStore = {
  showPreview: new BehaviorSubject(false),
  selectedParagraph: new BehaviorSubject<SelectedParagraph | null>(null),
  onlySelected: new BehaviorSubject(false),
  setPage: new Subject(),
  linkPreview: new BehaviorSubject<LinkPreviewParams | null>(null),
  savingLabels: new BehaviorSubject<boolean>(false),
  updatedLabels: new Subject<{ [key: string]: Classification[] }>(),
  currentField: new BehaviorSubject<{ field_type: string; field_id: string } | null>(null),
  init: initStore,
};

export const viewerState = {
  paragraphs: resource.pipe(map((resource) => (resource ? getMainFieldParagraphs(resource) : []))),
  showPreview: viewerStore.showPreview.asObservable(),
  onlySelected: viewerStore.onlySelected.asObservable(),
  linkPreview: viewerStore.linkPreview.asObservable(),
  savingLabels: viewerStore.savingLabels.asObservable(),
  searchReady: resource.pipe(filter((resource) => !!resource && Object.keys(resource.data || {}).length > 0)),
  pdfPreview: combineLatest([resource, viewerStore.selectedParagraph]).pipe(
    filter(([resource, selected]) => !!resource && !!selected),
    filter(([resource, selected]) => isParagraphOfKind(resource!, selected!, [PreviewKind.PDF])),
    map(([resource, selected]) => getPdfPreviewParams(resource!, selected!.fieldId, selected!.paragraph)),
  ),
  mediaPreview: combineLatest([resource, viewerStore.selectedParagraph]).pipe(
    filter(([resource, selected]) => !!resource && !!selected),
    filter(([resource, selected]) => isParagraphOfKind(resource!, selected!, [PreviewKind.VIDEO, PreviewKind.AUDIO])),
    switchMap(([resource, selected]) => getMediaPreviewParams(resource!, selected!.fieldId, selected!.paragraph)),
  ),
  youtubePreview: combineLatest([resource, viewerStore.selectedParagraph]).pipe(
    filter(([resource, selected]) => !!resource && !!selected),
    filter(([resource, selected]) => isParagraphOfKind(resource!, selected!, [PreviewKind.YOUTUBE])),
    map(([resource, selected]) => getYoutubePreviewParams(resource!, selected!.fieldId, selected!.paragraph)),
  ),
  isNotProcessed: resource.pipe(map((res) => res?.metadata?.status !== RESOURCE_STATUS.PROCESSED)),
};

export const selectedParagraphIndex = combineLatest([
  resource,
  merge(viewerSearchResults, viewerState.paragraphs),
  viewerStore.selectedParagraph,
]).pipe(
  filter(([resource, paragraphs, selected]) => !!resource && !!selected && !!paragraphs),
  map(([resource, paragraphs, selected]) => {
    const fieldType = getFieldType(selected!.fieldType);
    const selectedText = resource?.getParagraphText(fieldType, selected!.fieldId, selected!.paragraph);
    return (paragraphs || []).findIndex((result) => {
      const resultText = resource?.getParagraphText(fieldType, selected!.fieldId, result.paragraph);
      return selectedText !== undefined && resultText !== undefined && resultText === selectedText;
    });
  }),
);

const _paragraphLabels = viewerState.paragraphs.pipe(
  switchMap((paragraphs) =>
    resource.pipe(
      take(1),
      map((resource) => ({ resource, paragraphs })),
    ),
  ),
  map(({ resource, paragraphs }) =>
    paragraphs
      .filter((paragraph) => (paragraph.paragraph.classifications || []).length > 0)
      .reduce((acc, paragraph) => {
        acc[getParagraphId(resource!.id, paragraph)] = paragraph.paragraph.classifications || [];
        return acc;
      }, {} as { [key: string]: Classification[] }),
  ),
);

const _annotatedParagraphLabels = resource.pipe(
  map((resource) =>
    (resource?.fieldmetadata || []).reduce((acc, field) => {
      (field.paragraphs || []).forEach(({ key, classifications }) => {
        acc[key] = classifications;
      });
      return acc;
    }, {} as { [key: string]: Classification[] }),
  ),
);

export const paragraphLabels = combineLatest([
  _paragraphLabels,
  merge(_annotatedParagraphLabels, viewerStore.updatedLabels),
]).pipe(
  map(([labels, annotatedLabels]) => {
    const result = Object.entries(labels).reduce((acc, [key, value]) => {
      acc[key] = { labels: value, annotatedLabels: [] };
      return acc;
    }, {} as { [key: string]: ParagraphLabels });
    Object.entries(annotatedLabels).forEach(([key, value]) => {
      result[key] ? (result[key].annotatedLabels = value) : (result[key] = { labels: [], annotatedLabels: value });
    });
    return result;
  }),
  shareReplay(1),
);

export const pdfUrl = combineLatest([
  resource,
  viewerStore.selectedParagraph,
  merge(
    viewerStore.setPage,
    viewerState.pdfPreview.pipe(
      filter((p) => !!p),
      map((p) => p!.page),
    ),
  ),
]).pipe(
  filter(([resource, selected]) => !!resource && !!selected),
  map(([resource, selected, pageIndex]) => {
    const field = getFileField(resource!, selected!.fieldId);
    return field && getPages(field)[pageIndex];
  }),
  filter((pages) => !!pages),
) as Observable<CloudLink>;

export function initStore() {
  viewerStore.showPreview.next(false);
  viewerStore.selectedParagraph.next(null);
  viewerStore.linkPreview.next(null);
  viewerStore.currentField.next(null);
}

export function clearSearch() {
  viewerSearchQuery.set('');
  viewerSearchResults.set(null);
  hasViewerSearchError.set(false);
  viewerStore.onlySelected.next(false);
}

export function setParagraphLabels(labels: Classification[], paragraph: WidgetParagraph) {
  const currentResource = resource.value;
  const field = viewerStore.currentField.getValue();
  const saving = viewerStore.savingLabels.getValue();
  if (!currentResource || !field || saving) return;
  viewerStore.savingLabels.next(true);
  const paragraphId = getParagraphId(currentResource.id, paragraph);
  setLabels(currentResource, field.field_id, field.field_type, paragraphId, labels)
    .pipe(switchMap(() => paragraphLabels.pipe(take(1))))
    .subscribe((paragraphLabels) => {
      const existingLabels = Object.entries(paragraphLabels).reduce((acc, [key, value]) => {
        acc[key] = value.annotatedLabels;
        return acc;
      }, {} as { [key: string]: Classification[] });
      const newLabels = { ...existingLabels, [paragraphId]: labels };
      viewerStore.updatedLabels.next(newLabels);
      viewerStore.savingLabels.next(false);
    });
}

export function getPdfPreviewParams(
  resource: Resource,
  fieldId: string,
  paragraph: Paragraph,
): PdfPreviewParams | undefined {
  const field = getFileField(resource, fieldId);
  const text = field && resource.getParagraphText(FIELD_TYPE.file, fieldId, paragraph);
  const pageIndex = field && getParagraphPageIndexes(field, paragraph)[0];
  if (text && typeof pageIndex === 'number') {
    return {
      page: pageIndex,
      query: text,
      total: getPages(field).length,
    };
  } else {
    return;
  }
}

export function getMediaPreviewParams(
  resource: Resource,
  fieldId: string,
  paragraph: Paragraph,
): Observable<MediaPreviewParams | undefined> {
  const field = getFileField(resource, fieldId);
  const file = field && (getVideoStream(field) || field.value?.file);
  const time = paragraph.start_seconds?.[0];
  if (file?.uri && typeof time === 'number') {
    return getFileUrls([file.uri]).pipe(
      map((files) => ({
        file: { ...file, uri: files[0] },
        time,
      })),
    );
  } else {
    return of(undefined);
  }
}

export function getYoutubePreviewParams(
  resource: Resource,
  fieldId: string,
  paragraph: Paragraph,
): YoutubePreviewParams | undefined {
  const field = getLinkField(resource, fieldId);
  const uri = field?.value?.uri;
  const time = paragraph.start_seconds?.[0];
  if (uri && typeof time === 'number') {
    return { uri, time };
  } else {
    return undefined;
  }
}

function isParagraphOfKind(resource: Resource, selected: SelectedParagraph, kinds: PreviewKind[]) {
  const field = getField(resource!, selected!.fieldType, selected!.fieldId);
  const kind = field && getPreviewKind(field, selected!.paragraph);
  return !!kind && kinds.includes(kind);
}

export function selectSentence(resource: Resource, searchSentence: Search.Sentence) {
  const paragraph = findParagraphFromSearchSentence(resource, searchSentence, false);
  paragraph && _selectParagraph(resource, paragraph, searchSentence.field_type, searchSentence.field);
}

export function selectParagraph(resource: Resource, searchParagraph: Search.Paragraph) {
  const paragraph = findParagraphFromSearchParagraph(resource, searchParagraph);
  paragraph && _selectParagraph(resource, paragraph, searchParagraph.field_type, searchParagraph.field);
}

function _selectParagraph(resource: Resource, paragraph: Paragraph, fieldType: SHORT_FIELD_TYPE, fieldId: string) {
  const field = getField(resource, getFieldTypeKey(fieldType), fieldId);
  if (field && paragraph && getPreviewKind(field, paragraph) !== PreviewKind.NONE) {
    viewerStore.onlySelected.next(true);
    viewerStore.showPreview.next(true);
    viewerStore.selectedParagraph.next({
      fieldType: getFieldTypeKey(fieldType),
      fieldId: fieldId,
      paragraph,
    });
  }
}

export function search(resource: Resource, query: string): Observable<WidgetParagraph[]> {
  return resource.search(query, [Search.ResourceFeatures.PARAGRAPH]).pipe(
    tap((results) => {
      if (results.error) {
        hasViewerSearchError.set(true);
      }
    }),
    map((results) => results.paragraphs?.results || []),
    map(
      (paragraphs) =>
        paragraphs
          .map((searchParagraph) => {
            const fieldType = getFieldTypeKey(searchParagraph.field_type);
            const field = getField(resource, fieldType, searchParagraph.field);
            const ners = resource.getPositionedNamedEntities(fieldType, searchParagraph.field);
            const paragraph = findParagraphFromSearchParagraph(resource, searchParagraph);
            if (field && paragraph) {
              return getParagraph(resource, searchParagraph.field_type, searchParagraph.field, field, paragraph, ners);
            } else {
              return null;
            }
          })
          .filter((p) => !!p) as WidgetParagraph[],
    ),
  );
}

export function getMainFieldParagraphs(resource: Resource): WidgetParagraph[] {
  const fields = getFields(resource).filter((field) => !!field.field.extracted?.metadata?.metadata?.paragraphs);
  if (fields.length === 0) {
    return [];
  }
  const mainField = fields[0];
  const fieldType = getFieldType(mainField.field_type);
  viewerStore.currentField.next({
    field_type: fieldType,
    field_id: mainField.field_id,
  });
  const ners = resource.getPositionedNamedEntities(mainField.field_type as keyof ResourceData, mainField.field_id);
  return mainField.field.extracted!.metadata!.metadata!.paragraphs.map((paragraph) => {
    return getParagraph(
      resource,
      mainField.field_type as SHORT_FIELD_TYPE,
      mainField.field_id,
      mainField.field,
      paragraph,
      ners,
    );
  });
}

function getParagraph(
  resource: Resource,
  fieldType: FIELD_TYPE | SHORT_FIELD_TYPE,
  fieldId: string,
  field: IFieldData,
  paragraph: Paragraph,
  ners?: PositionedNER[],
): WidgetParagraph {
  let text = resource.getParagraphText(getFieldType(fieldType), fieldId, paragraph) || '';
  if (ners) {
    let lastNer = -1;
    const paragraphNers = ners
      .filter((ner) => !!ner.entity && ner.start > (paragraph.start || 0) && ner.start < (paragraph.end || 0))
      .sort((a, b) => a.start - b.start)
      // overlapping ners should not happen, but at the moment the API returns some
      .filter((ner) => {
        const isOverlapping = ner.start < lastNer;
        lastNer = ner.end;
        return !isOverlapping;
      })
      .map((ner) => ({ ...ner, start: ner.start - (paragraph.start || 0), end: ner.end - (paragraph.start || 0) }));
    let offset = 0;
    paragraphNers.forEach((ner) => {
      text =
        text.slice(0, ner.start + offset) +
        `<mark class="ner" family="${ner.family}">${text.slice(ner.start + offset, ner.end + offset)}</mark>` +
        text.slice(ner.end + offset);
      offset += 35 + ner.family.length;
    });
  }
  text = text.trim().replace(NEWLINE_REGEX, '<br>');

  const baseParagraph = {
    paragraph: paragraph,
    text,
    fieldType: fieldType,
    fieldId: fieldId,
    start: paragraph.start || 0,
    end: paragraph.end || 0,
  };

  const kind = getPreviewKind(field, paragraph);
  if (kind === PreviewKind.PDF) {
    return {
      ...baseParagraph,
      preview: kind,
      page: getParagraphPageIndexes(field as FileFieldData, paragraph)[0],
    };
  } else if (kind === PreviewKind.VIDEO || kind === PreviewKind.AUDIO || kind === PreviewKind.YOUTUBE) {
    return {
      ...baseParagraph,
      preview: kind,
      start_seconds: paragraph.start_seconds?.[0] || 0,
      end_seconds: paragraph.end_seconds?.[0] || 0,
    };
  } else {
    return {
      ...baseParagraph,
      preview: PreviewKind.NONE,
    };
  }
}

function getPreviewKind(field: IFieldData, paragraph: Paragraph) {
  if (field.extracted && 'file' in field.extracted) {
    if (getPages(field as FileFieldData).length && getParagraphPageIndexes(field as FileFieldData, paragraph).length) {
      return PreviewKind.PDF;
    } else if (paragraph.kind === 'TRANSCRIPT') {
      if (isFileType(field as FileFieldData, 'video/')) {
        return PreviewKind.VIDEO;
      } else if (isFileType(field as FileFieldData, 'audio/')) {
        return PreviewKind.AUDIO;
      }
    }
  } else if (field.value && 'uri' in field.value) {
    if (paragraph.kind === 'INCEPTION' || paragraph.kind === 'TRANSCRIPT') {
      return PreviewKind.YOUTUBE;
    }
  }
  return PreviewKind.NONE;
}

function getField(resource: Resource, fieldType: string, fieldId: string): IFieldData | undefined {
  return resource.data[fieldType as keyof ResourceData]?.[fieldId];
}

function getParagraphPageIndexes(fileField: FileFieldData, paragraph: Paragraph): number[] {
  return (fileField.extracted?.file?.file_pages_previews?.positions || []).reduce((acc, page, index) => {
    if (
      typeof paragraph.start !== 'number' ||
      typeof paragraph.end !== 'number' ||
      typeof page.start !== 'number' ||
      typeof page.end !== 'number'
    ) {
      return acc;
    }
    const overlapping =
      (paragraph.start >= page.start && paragraph.start <= page.end) ||
      (paragraph.end >= page.start && paragraph.end <= page.end);
    return overlapping ? acc.concat([index]) : acc;
  }, [] as number[]);
}

function getPages(fileField: FileFieldData): CloudLink[] {
  return fileField.extracted?.file?.file_pages_previews?.pages || [];
}

function isFileType(fileField: FileFieldData, type: string): boolean {
  const contentType = fileField.extracted?.file?.icon || '';
  return contentType === type || contentType.slice(0, type.length) === type;
}

// Temporary functions

export function findFileByType(resource: Resource | null, type: string): string | undefined {
  if (!resource) {
    return;
  }
  const file = Object.values(resource.data?.files || {}).find((fileField) => {
    return isFileType(fileField, type);
  });
  const url = file?.value?.file?.uri;
  return url ? url : undefined;
}

function getFieldTypeKey(fieldType: SHORT_FIELD_TYPE): keyof ResourceData {
  if (fieldType === SHORT_FIELD_TYPE.file) {
    return 'files';
  } else if (fieldType === SHORT_FIELD_TYPE.link) {
    return 'links';
  } else {
    return 'texts';
  }
}

function findParagraphFromSearchParagraph(
  resource: Resource,
  searchParagraph: Search.Paragraph,
): Paragraph | undefined {
  const fieldTypeKey = getFieldTypeKey(searchParagraph.field_type);
  const field = getField(resource, fieldTypeKey, searchParagraph.field);
  const paragraphs = field?.extracted?.metadata?.metadata?.paragraphs;
  const text = normalizeSearchParagraphText(searchParagraph.text);
  return paragraphs?.find(
    (paragraph) => text === resource.getParagraphText(getFieldType(fieldTypeKey), searchParagraph.field, paragraph),
  );
}

function findParagraphFromSearchSentence(
  resource: Resource,
  searchSentence: Search.Sentence,
  strict: boolean,
): Paragraph | undefined {
  const fieldTypeKey = getFieldTypeKey(searchSentence.field_type);
  const field = getField(resource, fieldTypeKey, searchSentence.field);
  const paragraphs = field?.extracted?.metadata?.metadata?.paragraphs;
  const text = normalizeSearchParagraphText(searchSentence.text);
  return paragraphs?.find((paragraph) => {
    if (strict) {
      return paragraph.sentences?.find(
        (sentence) => text === resource.getSentenceText(getFieldType(fieldTypeKey), searchSentence.field, sentence),
      );
    } else {
      return (resource.getParagraphText(getFieldType(fieldTypeKey), searchSentence.field, paragraph) || '').includes(
        text.trim(),
      );
    }
  });
}

const MARK_START = /<mark>/g;
const MARK_END = /<\/mark>/g;
function normalizeSearchParagraphText(text: string) {
  return text.replace(MARK_START, '').replace(MARK_END, '');
}
