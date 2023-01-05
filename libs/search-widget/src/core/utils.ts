import { fromFetch } from 'rxjs/fetch';
import { switchMap } from 'rxjs/operators';
import { from } from 'rxjs';
import type {
  CloudLink,
  FIELD_TYPE,
  FileFieldData,
  IResource,
  LinkFieldData,
  Resource,
  ResourceData,
  Search,
} from '@nuclia/core';
import type { MediaWidgetParagraph, PreviewKind, WidgetParagraph } from './models';

let CDN = 'https://cdn.nuclia.cloud/';
export const setCDN = (cdn: string) => (CDN = cdn);
export const getCDN = () => CDN;

export const loadFonts = () => {
  const fontLinkId = 'nuclia-fonts-link';
  if (!document.getElementById(fontLinkId)) {
    const font = document.createElement('link');
    font.id = fontLinkId;
    font.href = 'https://fonts.googleapis.com/css?family=Inter:300,400,600,700';
    font.rel = 'stylesheet';

    const head = document.head || document.getElementsByTagName('head')[0];
    head.appendChild(font);
  }
};

export const loadSvgSprite = () => {
  return fromFetch(`${getCDN()}icons/glyphs-sprite.svg`).pipe(switchMap((res) => res.text()));
};

export const getPdfJsBaseUrl = () => {
  return `https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105`;
};

export const getPdfJsStyle = () => {
  return from(
    fetch(`${getPdfJsBaseUrl()}/web/pdf_viewer.css`).then(function (response) {
      return response.text();
    }),
  );
};

export const formatDate = (date: string) => {
  const d = new Date(date);
  return d.toLocaleDateString();
};

export const formatTime = (sec: number) => {
  const d = new Date(0);
  d.setSeconds(sec);
  let startIndex = 11;
  if (sec < 3600) {
    startIndex = 14;
  }
  return d.toISOString().substring(startIndex, 19);
};

export const formatQueryKey = (key: string): string => {
  return `__nuclia_${key}__`;
};

export const updateQueryParams = (urlParams: URLSearchParams) => {
  const params = urlParams.toString();
  const url = params ? `${location.pathname}?${params}` : location.pathname;
  history.replaceState(null, '', url);
};

/**
 * Coerces a value (usually a string coming from a prop) to a boolean.
 * Credit to Angular: https://github.com/angular/components/blob/2f9a59a24c0464cbed7f54cbeb5cba73e6007715/src/cdk/coercion/boolean-property.ts
 * @param value
 */
export const coerceBooleanProperty = (value: any): boolean => {
  return value != null && `${value}` !== 'false';
};

export const getYoutubeId = (url: string) => {
  // From https://stackoverflow.com/a/9102270
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return match[2];
  } else {
    return '';
  }
};

export const isYoutubeUrl = (url: string) => {
  return !!getYoutubeId(url);
};

export const formatTitle = (title?: string): string => {
  title = title || '–';
  try {
    return decodeURIComponent(title);
  } catch (e) {
    return title;
  }
};

export const generatedEntitiesColor: { [key: string]: string } = {
  DATE: '#ff8989',
  EVENT: '#cba2da',
  FAC: '#81d8ac',
  GPE: '#454ade',
  LANGUAGE: '#d1d3ff',
  LAW: '#1E264F',
  LOC: '#b7a38d',
  MAIL: '#e81c66',
  MONEY: '#ff8c4b',
  NORP: '#743ccf',
  ORG: '#6eb0ec',
  PERCENT: '#1e264f',
  PERSON: '#ffe186',
  PRODUCT: '#d74f57',
  QUANTITY: '#b035c9',
  TIME: '#21b8a6',
  WORK_OF_ART: '#ffbccc',
};

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      // Strip non allowed characters
      .replace(/[^\w\s-_]+/gi, '')
      // Replace white spaces
      .trim()
      .replace(/\s+/gi, '-')
  );
}

export function goToUrl(url: string, paragraphText?: string) {
  const urlObject = new URL(url);
  if (urlObject.protocol.startsWith('http')) {
    let textFragment = '';
    const supportsTextFragments = 'fragmentDirective' in document;
    if (paragraphText && supportsTextFragments && !urlObject.hash) {
      textFragment = getTextFragment(paragraphText);
      if (textFragment) {
        url = url + textFragment;
      }
    }
    window.location.href = url;
  } else {
    console.info(`Invalid URL: ${url}`);
  }
}

function getTextFragment(paragraphText: string) {
  const encode = (text: string) => encodeURIComponent(text).replace(/-/g, '%2D');
  const minWords = 4;

  // Remove highlight
  paragraphText = paragraphText.replace(/<mark>/g, '').replace(/<\/mark>/g, '');

  // Split text into HTML elements and words
  const elementDelimiter = /\s+\n\s+/;
  const elements = paragraphText
    .trim()
    .split(elementDelimiter)
    .filter((element) => element.length > 0)
    .map((element) => element.split(/\s+/));

  if (elements.length === 1) {
    return `#:~:text=${encode(elements[0].join(' '))}`;
  } else {
    // Range syntax allow to select texts that span multiple elements (https://web.dev/text-fragments/#the-full-syntax)
    const textStart = elements[0];
    const textEnd = elements[elements.length - 1];

    // A minimum number of words is required, otherwise the wrong range could be selected
    if (textStart.length >= minWords && textEnd.length >= minWords) {
      return `#:~:text=${encode(textStart.slice(0, 6).join(' '))},${encode(textEnd.slice(-6).join(' '))}`;
    }
  }
  return '';
}

export function mapSmartParagraph2WidgetParagraph(
  paragraph: Search.SmartParagraph,
  kind: PreviewKind,
): WidgetParagraph {
  const start_seconds = paragraph.start_seconds?.[0];
  const end_seconds = paragraph.end_seconds?.[0];
  const start = paragraph.position?.start;
  const end = paragraph.position?.end;
  return {
    paragraph,
    fieldType: paragraph.field_type,
    fieldId: paragraph.field,
    text: paragraph.text,
    preview: kind,
    start,
    end,
    page: paragraph.position?.page_number,
    pid: `${paragraph.field_type}${start}${end}`,
    start_seconds,
    end_seconds,
  } as WidgetParagraph;
}

export function getVideoStream(fileField: FileFieldData): CloudLink | undefined {
  return fileField.extracted?.file?.file_generated?.['video.mpd'];
}

export function getFileField(resource: Resource, fieldId: string): FileFieldData | undefined {
  return resource.data.files?.[fieldId];
}

export function getLinkField(resource: Resource, fieldId: string): LinkFieldData | undefined {
  return resource.data.links?.[fieldId];
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

export function getFieldType(fieldType: string): FIELD_TYPE {
  return (fieldType.endsWith('s') ? fieldType.slice(0, fieldType.length - 1) : fieldType) as FIELD_TYPE;
}

export function getExtractedTexts(resource: Resource) {
  const fields = getFields(resource).filter((field) => !!field.field.extracted?.metadata?.metadata?.paragraphs);
  if (fields.length === 0) {
    return [];
  }
  const mainField = fields[0];
  return (mainField.field.extracted?.metadata?.metadata?.paragraphs || []).map((paragraph) =>
    resource.getParagraphText(getFieldType(mainField.field_type), mainField.field_id, paragraph).trim(),
  );
}

export const NEWLINE_REGEX = /\n/g;
export function getMediaTranscripts(
  resource: Resource,
  kind: PreviewKind.VIDEO | PreviewKind.AUDIO | PreviewKind.YOUTUBE,
): MediaWidgetParagraph[] {
  const fields = getFields(resource).filter((field) => !!field.field.extracted?.metadata?.metadata?.paragraphs);
  if (fields.length === 0) {
    return [];
  }
  const mainField = fields[0];
  const fieldType = getFieldType(mainField.field_type);
  return (mainField.field.extracted?.metadata?.metadata?.paragraphs || []).map((paragraph) => {
    const text = resource.getParagraphText(fieldType, mainField.field_id, paragraph);
    return {
      paragraph: paragraph,
      text: text.trim().replace(NEWLINE_REGEX, '<br>'),
      fieldType: fieldType,
      fieldId: mainField.field_id,
      preview: kind,
      start: paragraph.start || 0,
      end: paragraph.end || 0,
      start_seconds: paragraph.start_seconds?.[0] || 0,
      end_seconds: paragraph.end_seconds?.[0] || 0,
    };
  });
}

export const getParagraphId = (rid: string, paragraph: WidgetParagraph) => {
  const type = paragraph.fieldType.slice(0, -1);
  const typeABBR = type === 'link' ? 'u' : type[0];
  return `${rid}/${typeABBR}/${paragraph.fieldId}/${paragraph.paragraph.start!}-${paragraph.paragraph.end!}`;
};

export const getExternalUrl = (resource: IResource) => {
  const linkField = Object.values(resource.data?.links || {})[0];
  const fileField = Object.values(resource.data?.files || {})[0];
  if (linkField?.value?.uri) {
    return linkField.value.uri;
  } else if (fileField?.value?.external && fileField?.value?.file?.uri) {
    return fileField.value.file.uri;
  }
  return undefined;
};
