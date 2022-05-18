import { Search } from '../../../sdk-core/src';
import type {
  Resource,
  IFieldData,
  Paragraph,
  FileFieldData,
  LinkFieldData,
  CloudLink,
  ResourceField,
  ResourceData,
  Sentence,
} from '@nuclia/core';
import {
  Observable,
  Subject,
  BehaviorSubject,
  merge,
  combineLatest,
  switchMap,
  map,
  tap,
  filter,
  distinctUntilChanged,
  of,
} from 'rxjs';
import type {
  PdfPreviewParams,
  MediaPreviewParams,
  LinkPreviewParams,
  WidgetParagraph,
  SelectedParagraph,
} from '../core/models';
import { PreviewKind, SearchOrder } from '../core/models';
import { getFileUrls } from '../core/api';

const DEFAULT_SEARCH_ORDER = SearchOrder.SEQUENTIAL;

export const viewerStore: {
  resource: BehaviorSubject<Resource | null>;
  query: BehaviorSubject<string>;
  paragraphs: BehaviorSubject<WidgetParagraph[]>;
  results: BehaviorSubject<WidgetParagraph[] | null>;
  showPreview: BehaviorSubject<boolean>;
  selectedParagraph: BehaviorSubject<SelectedParagraph | null>;
  onlySelected: BehaviorSubject<boolean>;
  setPage: Subject<number>;
  linkPreview: BehaviorSubject<LinkPreviewParams | null>;
  order: Subject<SearchOrder>;
  init: () => void;
} = {
  resource: new BehaviorSubject(null),
  query: new BehaviorSubject(''),
  paragraphs: new BehaviorSubject([]),
  results: new BehaviorSubject(null),
  showPreview: new BehaviorSubject(false),
  selectedParagraph: new BehaviorSubject(null),
  onlySelected: new BehaviorSubject(false),
  setPage: new Subject(),
  linkPreview: new BehaviorSubject(null),
  order: new BehaviorSubject<SearchOrder>(DEFAULT_SEARCH_ORDER),
  init: initStore,
};

export const viewerState = {
  query: viewerStore.query.pipe(
    map((q) => q.trim()),
    distinctUntilChanged(),
  ),
  paragraphs: viewerStore.paragraphs.asObservable(),
  showPreview: viewerStore.showPreview.asObservable(),
  onlySelected: viewerStore.onlySelected.asObservable(),
  linkPreview: viewerStore.linkPreview.asObservable(),
  searchReady: viewerStore.resource.pipe(filter((resource) => !!resource && Object.keys(resource.data || {}).length > 0)),
  results: combineLatest([ viewerStore.results, viewerStore.order]).pipe(
    map(([results, order]) => results && sortParagraphs(results, order))
  ),
  pdfPreview: combineLatest([viewerStore.resource, viewerStore.selectedParagraph]).pipe(
    filter(([resource, selected]) => !!resource && !!selected),
    filter(([resource, selected]) => {
      const field = getField(resource, selected.fieldType, selected.fieldId);
      return getPreviewKind(field, selected.paragraph) === PreviewKind.PDF;
    }),
    map(([resource, selected]) => getPdfPreviewParams(resource, selected.fieldId, selected.paragraph)),
  ),
  mediaPreview: combineLatest([viewerStore.resource, viewerStore.selectedParagraph]).pipe(
    filter(([resource, selected]) => !!resource && !!selected),
    filter(([resource, selected]) => {
      const field = getField(resource, selected.fieldType, selected.fieldId);
      const kind = getPreviewKind(field, selected.paragraph);
      return [PreviewKind.VIDEO, PreviewKind.AUDIO].includes(kind);
    }),
    switchMap(([resource, selected]) => getMediaPreviewParams(resource, selected.fieldId, selected.paragraph)),
  )
};

export const selectedParagraphIndex = combineLatest([
  viewerStore.resource,
  merge(viewerState.results, viewerStore.paragraphs),
  viewerStore.selectedParagraph,
]).pipe(
  filter(([resource, paragraphs, selected]) => !!resource && !!selected && !!paragraphs),
  map(([resource, paragraphs, selected]) => {
    return (paragraphs || []).findIndex((result) => {
      const field = getFileField(resource, selected.fieldId);
      const text = field && getParagraphText(field, selected.paragraph);
      return result.text === text;
    });
  }),
);

export const pdfUrl = combineLatest([
  viewerStore.resource,
  viewerStore.selectedParagraph,
  merge(
    viewerStore.setPage,
    viewerState.pdfPreview.pipe(
      filter((p) => !!p),
      map((p) => p.page),
    ),
  ),
]).pipe(
  filter(([resource, selected]) => !!resource && !!selected),
  map(([resource, selected, pageIndex]) => {
    const field = getFileField(resource, selected.fieldId);
    return getPages(field)[pageIndex];
  }),
);

export function initStore() {
  viewerStore.resource.next(null);
  viewerStore.query.next('');
  viewerStore.results.next(null);
  viewerStore.showPreview.next(false);
  viewerStore.selectedParagraph.next(null);
  viewerStore.linkPreview.next(null);
  viewerStore.order.next(DEFAULT_SEARCH_ORDER);
}

export function clearSearch() {
  viewerStore.query.next('');
  viewerStore.results.next(null);
  viewerStore.onlySelected.next(false);
}

export function getPdfPreviewParams(
  resource: Resource,
  fieldId: string,
  paragraph: Paragraph,
): PdfPreviewParams | undefined {
  const field = getFileField(resource, fieldId);
  const text = field && getParagraphText(field, paragraph);
  const pageIndex = field && getParagraphPageIndexes(field, paragraph)[0];
  if (text && typeof pageIndex === 'number') {
    return {
      page: pageIndex,
      query: text,
      total: getPages(field).length,
    };
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

export function selectSentence(resource: Resource, searchSentence: Search.Sentence) {
  const paragraph = findParagraphFromSearchSentence(resource, searchSentence, false);  
  paragraph && _selectParagraph(resource, paragraph, searchSentence.field_type, searchSentence.field);
}

export function selectParagraph(resource: Resource, searchParagraph: Search.Paragraph) {
  const paragraph = findParagraphFromSearchParagraph(resource, searchParagraph);
  paragraph && _selectParagraph(resource, paragraph, searchParagraph.field_type, searchParagraph.field);
}

function _selectParagraph(resource: Resource, paragraph: Paragraph, fieldType: string, fieldId: string) {
  const field = getField(resource, getFieldType(fieldType), fieldId);
  if (field && paragraph && getPreviewKind(field, paragraph) !== PreviewKind.NONE) {
    viewerStore.onlySelected.next(true);
    viewerStore.showPreview.next(true);
    viewerStore.selectedParagraph.next({
      fieldType: getFieldType(fieldType),
      fieldId: fieldId,
      paragraph,
    });
  }
}

export function search(resource: Resource, query: string): Observable<WidgetParagraph[]> {
  return resource.search(query, [Search.Features.PARAGRAPH]).pipe(
    map((results) => results.paragraphs?.results || []),
    map((paragraphs) =>
      paragraphs.map((searchParagraph) => {
        const field = getField(resource, getFieldType(searchParagraph.field_type), searchParagraph.field);
        const paragraph = findParagraphFromSearchParagraph(resource, searchParagraph);
        if (field && paragraph) {
          return getParagraph(getFieldType(searchParagraph.field_type), searchParagraph.field, field, paragraph);
        } else {
          return {
            fieldType: getFieldType(searchParagraph.field_type),
            fieldId: searchParagraph.field,
            text: searchParagraph.text,
            preview: PreviewKind.NONE,
          };
        }
      }),
    ),
  );
}

export function getResourceParagraphs(resource: Resource): WidgetParagraph[] {
  return getFields(resource)
    .filter((field) => !!field.extracted?.metadata?.metadata?.paragraphs)
    .reduce(
      (acc, current) =>
        acc.concat(
          current.extracted!.metadata!.metadata!.paragraphs.map((paragraph) => {
            return getParagraph(current.field_type, current.field_id, current, paragraph);
          }),
        ),
      [] as WidgetParagraph[],
    );
}

function sortParagraphs(paragraphs: WidgetParagraph[], order: SearchOrder) {
  if (order === SearchOrder.SEQUENTIAL) {
    return paragraphs.slice().sort((a, b) => {
      const aIsNumber = typeof a.paragraph.start === 'number';
      const bIsNumber = typeof b.paragraph.start === 'number';
      if (!aIsNumber && !bIsNumber) return 0;
      if (aIsNumber && !bIsNumber) return 1;
      if (!aIsNumber && bIsNumber) return -1;
      if (aIsNumber && bIsNumber) return a.paragraph.start! - b.paragraph.start!;
    });
  }
  return paragraphs;
}

function getPreviewKind(field: IFieldData, paragraph: Paragraph) {
  if (field?.extracted && 'file' in field.extracted) {
    if (
      getPages(field as FileFieldData).length &&
      getParagraphPageIndexes(field as FileFieldData, paragraph).length
    ) {
      return PreviewKind.PDF;
    } else if (paragraph.kind === 'TRANSCRIPT') {
      if (isFileType(field as FileFieldData, 'video/')) {
        return PreviewKind.VIDEO;
      } else if (isFileType(field as FileFieldData, 'audio/')) {
        return PreviewKind.AUDIO;
      }
    }
  }
  return PreviewKind.NONE;
}

function getParagraph(fieldType: string, fieldId: string, field: IFieldData, paragraph: Paragraph): WidgetParagraph {
  const baseParagraph = {
    paragraph: paragraph,
    text: getParagraphText(field, paragraph),
    fieldType: fieldType,
    fieldId: fieldId,
  };
  const kind = getPreviewKind(field, paragraph);
  if (kind === PreviewKind.PDF) {
    return {
      ...baseParagraph,
      preview: kind,
      page: getParagraphPageIndexes(field as FileFieldData, paragraph)[0],
    };
  } else if (kind === PreviewKind.VIDEO || kind === PreviewKind.AUDIO) {
    return {
      ...baseParagraph,
      preview: kind,
      time: paragraph.start_seconds[0],
    };
  } else {
    return {
      ...baseParagraph,
      preview: PreviewKind.NONE,
    };
  }
}

export function getFields(resource: Resource): ResourceField[] {
  return Object.keys(resource.data)
    .reduce((acc, fieldType) => {
      const fields = Object.keys(resource.data[fieldType]).map((fieldId) => [fieldType, fieldId]);
      return acc.concat(fields);
    }, [])
    .map(([fieldType, fieldId]) => ({
      ...resource.data[fieldType][fieldId],
      field_type: fieldType,
      field_id: fieldId,
    }));
}

export function getField(resource: Resource, fieldType: string, fieldId: string): IFieldData | undefined {
  return resource.data[fieldType]?.[fieldId];
}

export function getFileField(resource: Resource, fieldId: string): FileFieldData | undefined {
  return resource.data.files?.[fieldId];
}

export function getParagraphText(field: IFieldData, paragraph: Paragraph): string | undefined {
  return field.extracted?.text?.text.slice(paragraph.start, paragraph.end);
}

export function getSentenceText(field: IFieldData, sentence: Sentence): string | undefined {
  return field.extracted?.text?.text.slice(sentence.start, sentence.end);
}

export function getParagraphPageIndexes(fileField: FileFieldData, paragraph: Paragraph): number[] {
  return (fileField.extracted?.file?.file_pages_previews?.positions || []).reduce((acc, current, index) => {
    const overlapping =
      (paragraph.start >= current.start && paragraph.start <= current.end) ||
      (paragraph.end >= current.start && paragraph.end <= current.end);
    return overlapping ? acc.concat([index]) : acc;
  }, [] as number[]);
}

export function getParagraphPages(fileField: FileFieldData, paragraph: Paragraph): CloudLink[] {
  return getParagraphPageIndexes(fileField, paragraph).map((index) => getPages(fileField)[index]);
}

export function getPages(fileField: FileFieldData): CloudLink[] {
  return fileField.extracted?.file?.file_pages_previews?.pages || [];
}

export function getVideoStream(fileField: FileFieldData):  CloudLink | undefined {
  return fileField.extracted?.file?.file_generated?.['video.mpd'];
}

// Temprary functions

export function getLinks(resource: Resource): string[] {
  return resource
    .getFields(['links'])
    .filter((field) => !!field.value)
    .map((field) => (field as LinkFieldData)!.value!.uri);
}

export function getLinksPreviews(resource: Resource): CloudLink[] {
  return resource
    .getFields(['links'])
    .map((field) => (field as LinkFieldData).extracted?.link?.link_preview)
    .filter((preview) => !!preview);
}

export function findFileByType(resource: Resource, type: string): string | undefined {
  const file = Object.values(resource.data?.files || {}).find((fileField) => {
    return isFileType(fileField, type);
  });
  const url = file?.value?.file?.uri;
  return url ? url : undefined;
}

function isFileType(fileField: FileFieldData, type: string): boolean {
  const contentType = fileField.extracted?.file?.icon || '';
  return contentType === type || contentType.slice(0, type.length) === type;
}

function getFieldType(fieldType: string): string {
  if (fieldType === 'f') {
    return 'files';
  } else if (fieldType === 'u') {
    return 'links';
  } else {
    return 'texts';
  }
}

function findParagraphFromSearchParagraph(
  resource: Resource,
  searchParagraph: Search.Paragraph,
): Paragraph | undefined {
  const field = resource.data[getFieldType(searchParagraph.field_type)]?.[searchParagraph.field];
  const paragraphs = field?.extracted?.metadata?.metadata?.paragraphs;
  return paragraphs?.find((paragraph) => searchParagraph.text === getParagraphText(field, paragraph));
}

function findParagraphFromSearchSentence(
  resource: Resource,
  searchSenctence: Search.Sentence,
  strict: boolean,
): Paragraph | undefined {
  const field = resource.data[getFieldType(searchSenctence.field_type) as keyof ResourceData]?.[searchSenctence.field];
  const paragraphs = field?.extracted?.metadata?.metadata?.paragraphs;
  return paragraphs?.find((paragraph) => (
    paragraph.sentences?.find((sentence) => (
      strict 
        ? searchSenctence.text === getSentenceText(field!, sentence)
        : (getParagraphText(field!, paragraph) || '').includes(searchSenctence.text.trim())
    ))
  ));
}