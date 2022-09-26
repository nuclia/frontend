import type {
  Classification,
  CloudLink,
  FileFieldData,
  IFieldData,
  LinkFieldData,
  Paragraph,
  Resource,
  ResourceData,
  Sentence,
} from '../../../sdk-core/src';
import { Search } from '../../../sdk-core/src';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
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
  PdfPreviewParams,
  SelectedParagraph,
  WidgetParagraph,
  YoutubePreviewParams,
} from '../core/models';
import { PreviewKind, SearchOrder } from '../core/models';
import { getFileUrls } from '../core/api';
import { isYoutubeUrl } from '../core/utils';
import type { AnnotationStore } from './stores/annotation.store';
import { annotationStore } from './stores/annotation.store';
import type { ResourceStore } from './stores/resource.store';
import { resourceStore } from './stores/resource.store';

const DEFAULT_SEARCH_ORDER = SearchOrder.SEQUENTIAL;

type ViewerStore = {
  query: BehaviorSubject<string>;
  results: BehaviorSubject<WidgetParagraph[] | null>;
  hasSearchError: BehaviorSubject<boolean>;
  showPreview: BehaviorSubject<boolean>;
  selectedParagraph: BehaviorSubject<SelectedParagraph | null>;
  onlySelected: BehaviorSubject<boolean>;
  setPage: Subject<number>;
  linkPreview: BehaviorSubject<LinkPreviewParams | null>;
  order: Subject<SearchOrder>;
  savingLabels: BehaviorSubject<boolean>;
  updatedLabels: Subject<{ [key: string]: Classification[] }>;
  currentField: BehaviorSubject<{ field_type: string; field_id: string } | null>;
  init: () => void;
};

export const viewerStore: ViewerStore & AnnotationStore & ResourceStore = {
  query: new BehaviorSubject(''),
  results: new BehaviorSubject<WidgetParagraph[] | null>(null),
  hasSearchError: new BehaviorSubject<boolean>(false),
  showPreview: new BehaviorSubject(false),
  selectedParagraph: new BehaviorSubject<SelectedParagraph | null>(null),
  onlySelected: new BehaviorSubject(false),
  setPage: new Subject(),
  linkPreview: new BehaviorSubject<LinkPreviewParams | null>(null),
  order: new BehaviorSubject<SearchOrder>(DEFAULT_SEARCH_ORDER),
  savingLabels: new BehaviorSubject<boolean>(false),
  updatedLabels: new Subject<{ [key: string]: Classification[] }>(),
  currentField: new BehaviorSubject<{ field_type: string; field_id: string } | null>(null),
  ...annotationStore,
  ...resourceStore,
  init: initStore,
};

export const viewerState = {
  query: viewerStore.query.pipe(
    tap(() => viewerStore.hasSearchError.next(false)),
    map((q) => q.trim()),
    distinctUntilChanged(),
  ),
  paragraphs: viewerStore.resource.pipe(map((resource) => (resource ? getMainFieldParagraphs(resource) : []))),
  showPreview: viewerStore.showPreview.asObservable(),
  onlySelected: viewerStore.onlySelected.asObservable(),
  linkPreview: viewerStore.linkPreview.asObservable(),
  savingLabels: viewerStore.savingLabels.asObservable(),
  searchReady: viewerStore.resource.pipe(
    filter((resource) => !!resource && Object.keys(resource.data || {}).length > 0),
  ),
  results: combineLatest([viewerStore.results, viewerStore.order]).pipe(
    map(([results, order]) => results && sortParagraphs(results, order)),
  ),
  hasSearchError: viewerStore.hasSearchError.asObservable(),
  pdfPreview: combineLatest([viewerStore.resource, viewerStore.selectedParagraph]).pipe(
    filter(([resource, selected]) => !!resource && !!selected),
    filter(([resource, selected]) => isParagraphOfKind(resource!, selected!, [PreviewKind.PDF])),
    map(([resource, selected]) => getPdfPreviewParams(resource!, selected!.fieldId, selected!.paragraph)),
  ),
  mediaPreview: combineLatest([viewerStore.resource, viewerStore.selectedParagraph]).pipe(
    filter(([resource, selected]) => !!resource && !!selected),
    filter(([resource, selected]) => isParagraphOfKind(resource!, selected!, [PreviewKind.VIDEO, PreviewKind.AUDIO])),
    switchMap(([resource, selected]) => getMediaPreviewParams(resource!, selected!.fieldId, selected!.paragraph)),
  ),
  youtubePreview: combineLatest([viewerStore.resource, viewerStore.selectedParagraph]).pipe(
    filter(([resource, selected]) => !!resource && !!selected),
    filter(([resource, selected]) => isParagraphOfKind(resource!, selected!, [PreviewKind.YOUTUBE])),
    map(([resource, selected]) => getYoutubePreviewParams(resource!, selected!.fieldId, selected!.paragraph)),
  ),
};

export const selectedParagraphIndex = combineLatest([
  viewerStore.resource,
  merge(viewerState.results, viewerState.paragraphs),
  viewerStore.selectedParagraph,
]).pipe(
  filter(([resource, paragraphs, selected]) => !!resource && !!selected && !!paragraphs),
  map(([resource, paragraphs, selected]) => {
    return (paragraphs || []).findIndex((result) => {
      const field = getField(resource!, selected!.fieldType, selected!.fieldId);
      const text = field && getParagraphText(field, selected!.paragraph);
      return result.text === text;
    });
  }),
);

const _paragraphLabels = viewerState.paragraphs.pipe(
  switchMap((paragraphs) =>
    viewerStore.resource.pipe(
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

export const paragraphLabels = merge(_paragraphLabels, viewerStore.updatedLabels).pipe(shareReplay(1));

export const pdfUrl = combineLatest([
  viewerStore.resource,
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
  resourceStore.init();
  viewerStore.query.next('');
  viewerStore.results.next(null);
  viewerStore.hasSearchError.next(false);
  viewerStore.showPreview.next(false);
  viewerStore.selectedParagraph.next(null);
  viewerStore.linkPreview.next(null);
  viewerStore.order.next(DEFAULT_SEARCH_ORDER);
  viewerStore.currentField.next(null);
}

export function clearSearch() {
  viewerStore.query.next('');
  viewerStore.results.next(null);
  viewerStore.hasSearchError.next(false);
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
    tap((results) => {
      if (results.error) {
        viewerStore.hasSearchError.next(true);
      }
    }),
    map((results) => results.paragraphs?.results || []),
    map(
      (paragraphs) =>
        paragraphs
          .map((searchParagraph) => {
            const field = getField(resource, getFieldType(searchParagraph.field_type), searchParagraph.field);
            const paragraph = findParagraphFromSearchParagraph(resource, searchParagraph);
            if (field && paragraph) {
              return getParagraph(getFieldType(searchParagraph.field_type), searchParagraph.field, field, paragraph);
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
  //possible field types: 'file', 'link', 'datetime', 'keywordset', 'text', 'layout', 'generic', 'conversation'
  const fieldType = mainField.field_type.endsWith('s')
    ? mainField.field_type.slice(0, mainField.field_type.length - 1)
    : mainField.field_type;
  viewerStore.currentField.next({
    field_type: fieldType,
    field_id: mainField.field_id,
  });
  return mainField.field.extracted!.metadata!.metadata!.paragraphs.map((paragraph) => {
    return getParagraph(mainField.field_type, mainField.field_id, mainField.field, paragraph);
  });
}

function sortParagraphs(paragraphs: WidgetParagraph[], order: SearchOrder) {
  if (order === SearchOrder.SEQUENTIAL) {
    return paragraphs.slice().sort((a, b) => {
      const aIsNumber = typeof a.paragraph.start === 'number';
      const bIsNumber = typeof b.paragraph.start === 'number';
      if (!aIsNumber && !bIsNumber) {
        return 0;
      } else if (aIsNumber && !bIsNumber) {
        return 1;
      } else if (!aIsNumber && bIsNumber) {
        return -1;
      } else {
        return a.paragraph.start! - b.paragraph.start!;
      }
    });
  }
  return paragraphs;
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

function getParagraph(fieldType: string, fieldId: string, field: IFieldData, paragraph: Paragraph): WidgetParagraph {
  const baseParagraph = {
    paragraph: paragraph,
    text: getParagraphText(field, paragraph) || '',
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

export function getFields(resource: Resource) {
  return Object.keys(resource.data)
    .reduce((acc, fieldType) => {
      const fieldKeys = Object.keys(resource.data[fieldType as keyof ResourceData] || {});
      const fields = fieldKeys.map((fieldId) => [fieldType, fieldId]);
      return acc.concat(fields);
    }, [] as string[][])
    .map(([fieldType, fieldId]) => ({
      field: resource.data[fieldType as keyof ResourceData]![fieldId],
      field_type: fieldType,
      field_id: fieldId,
    }));
}

export function getField(resource: Resource, fieldType: string, fieldId: string): IFieldData | undefined {
  return resource.data[fieldType as keyof ResourceData]?.[fieldId];
}

export function getFileField(resource: Resource, fieldId: string): FileFieldData | undefined {
  return resource.data.files?.[fieldId];
}

export function getLinkField(resource: Resource, fieldId: string): LinkFieldData | undefined {
  return resource.data.links?.[fieldId];
}

export function getParagraphText(field: IFieldData, paragraph: Paragraph): string | undefined {
  return field.extracted?.text?.text?.slice(paragraph.start, paragraph.end);
}

export function getSentenceText(field: IFieldData, sentence: Sentence): string | undefined {
  return field.extracted?.text?.text?.slice(sentence.start, sentence.end);
}

export function getParagraphPageIndexes(fileField: FileFieldData, paragraph: Paragraph): number[] {
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

export function getParagraphPages(fileField: FileFieldData, paragraph: Paragraph): CloudLink[] {
  return getParagraphPageIndexes(fileField, paragraph).map((index) => getPages(fileField)[index]);
}

export function getPages(fileField: FileFieldData): CloudLink[] {
  return fileField.extracted?.file?.file_pages_previews?.pages || [];
}

export function getVideoStream(fileField: FileFieldData): CloudLink | undefined {
  return fileField.extracted?.file?.file_generated?.['video.mpd'];
}

// Temprary functions

export function getLinks(resource: Resource): string[] {
  return resource
    .getFields(['links'])
    .map((field) => (field as LinkFieldData).value?.uri)
    .filter((uri) => !!uri) as string[];
}

export function getLinksPreviews(resource: Resource): CloudLink[] {
  return resource
    .getFields(['links'])
    .filter((field) => !isYoutubeField(field as LinkFieldData))
    .map((field) => (field as LinkFieldData).extracted?.link?.link_preview)
    .filter((preview) => !!preview) as CloudLink[];
}

export function findFileByType(resource: Resource, type: string): string | undefined {
  const file = Object.values(resource.data?.files || {}).find((fileField) => {
    return isFileType(fileField, type);
  });
  const url = file?.value?.file?.uri;
  return url ? url : undefined;
}

export const getParagraphId = (rid: string, paragraph: WidgetParagraph) => {
  const type = paragraph.fieldType.slice(0, -1);
  const typeABBR = type === 'link' ? 'u' : type[0];
  return `${rid}/${typeABBR}/${paragraph.fieldId}/${paragraph.paragraph.start!}-${paragraph.paragraph.end!}`;
};

function isFileType(fileField: FileFieldData, type: string): boolean {
  const contentType = fileField.extracted?.file?.icon || '';
  return contentType === type || contentType.slice(0, type.length) === type;
}

function getFieldType(fieldType: string): keyof ResourceData {
  if (fieldType === 'f') {
    return 'files';
  } else if (fieldType === 'u') {
    return 'links';
  } else {
    return 'texts';
  }
}

function isYoutubeField(field: LinkFieldData): boolean {
  return field.value?.uri ? isYoutubeUrl(field.value.uri) : false;
}

function findParagraphFromSearchParagraph(
  resource: Resource,
  searchParagraph: Search.Paragraph,
): Paragraph | undefined {
  const field = resource.data[getFieldType(searchParagraph.field_type)]?.[searchParagraph.field];
  const paragraphs = field?.extracted?.metadata?.metadata?.paragraphs;
  const text = normalizeSearchParagraphText(searchParagraph.text);
  return paragraphs?.find((paragraph) => text === getParagraphText(field as IFieldData, paragraph));
}

function findParagraphFromSearchSentence(
  resource: Resource,
  searchSenctence: Search.Sentence,
  strict: boolean,
): Paragraph | undefined {
  const field = resource.data[getFieldType(searchSenctence.field_type) as keyof ResourceData]?.[searchSenctence.field];
  const paragraphs = field?.extracted?.metadata?.metadata?.paragraphs;
  const text = normalizeSearchParagraphText(searchSenctence.text);
  return paragraphs?.find((paragraph) =>
    strict
      ? paragraph.sentences?.find((sentence) => text === getSentenceText(field!, sentence))
      : (getParagraphText(field!, paragraph) || '').includes(text.trim()),
  );
}

function normalizeSearchParagraphText(text: string) {
  return text.replace(/<mark>/g, '').replace(/<\/mark>/g, '');
}
