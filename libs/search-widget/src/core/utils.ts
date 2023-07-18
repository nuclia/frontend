import { fromFetch } from 'rxjs/fetch';
import { switchMap } from 'rxjs/operators';
import { from, map, of } from 'rxjs';
import {
  FIELD_TYPE,
  FieldFullId,
  FileField,
  FileFieldData,
  IFieldData,
  IResource,
  LinkField,
  longToShortFieldType,
  ResourceField,
  Search,
  sliceUnicode,
} from '@nuclia/core';
import { getFileUrls } from './api';

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
  const baseUrl = `${location.pathname}${location.hash.split('?')[0]}`;
  const url = params ? `${baseUrl}?${params}` : baseUrl;
  history.replaceState(null, '', url);
};

export function getUrlParams(): URLSearchParams {
  const params =
    window.location.hash && window.location.hash.includes('?')
      ? window.location.hash.slice(window.location.hash.indexOf('?'))
      : window.location.search;
  return new URLSearchParams(params);
}

/**
 * Coerces a value (usually a string coming from a prop) to a boolean.
 * Credit to Angular: https://github.com/angular/components/blob/2f9a59a24c0464cbed7f54cbeb5cba73e6007715/src/cdk/coercion/boolean-property.ts
 * @param value
 */
/*eslint-disable  @typescript-eslint/no-explicit-any*/
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

export const entitiesDefaultColor = '#c6c6c6';

export const generatedEntitiesColor: { [key: string]: string } = {
  DATE: '#FF8989',
  EVENT: '#CBA2DA',
  FAC: '#81D8AC',
  GPE: '#6EB0EC',
  LANGUAGE: '#D1D3FF',
  LAW: '#9295E7',
  LOC: '#D1BEA9',
  MAIL: '#D2F1E1',
  MONEY: '#FF8C4B',
  NORP: '#CFE8FF',
  ORG: '#A0E3FF',
  PERCENT: '#FBDBB9',
  PERSON: '#FFDA69',
  PRODUCT: '#FF6363',
  QUANTITY: '#E7D2EF',
  TIME: '#21B8A6',
  WORK_OF_ART: '#ffc7c7',
};

/**
 * Return black for bright color, and white for dark color
 * @param hexa: hexadecimal color
 */
export function getFontColor(hexa: string): string {
  const color = hexToRGB(hexa);
  if (!color) return '#000';
  // Counting the perceptive luminance - human eye favors green color...
  const luminance = (0.299 * color.r + 0.587 * color.g + 0.114 * color.b) / 255;
  return luminance > 0.5 ? '#000' : '#fff';
}

const HEX_REGEX = /^#([0-9a-f]{3,6})$/;

function hexToRGB(hex: string): { r: number; g: number; b: number } | undefined {
  hex = hex.toLowerCase();
  if (!HEX_REGEX.test(hex)) return;
  // 3 digits
  if (hex.length === 4) {
    return {
      r: parseInt(hex[1] + hex[1], 16),
      g: parseInt(hex[2] + hex[2], 16),
      b: parseInt(hex[3] + hex[3], 16),
    };
    // 6 digits
  } else {
    return {
      r: parseInt(hex[1] + hex[2], 16),
      g: parseInt(hex[3] + hex[4], 16),
      b: parseInt(hex[5] + hex[6], 16),
    };
  }
}

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

export function getFieldType(fieldType: string): FIELD_TYPE {
  return (fieldType.endsWith('s') ? fieldType.slice(0, fieldType.length - 1) : fieldType) as FIELD_TYPE;
}

export function getExtractedTexts(data: IFieldData | null): { shortId: string; text: string }[] {
  if (!data) {
    return [];
  }
  const text = data.extracted?.text?.text || '';
  const hasUnicodeCharacters =
    text.length > 0 && text.length !== (data.extracted?.metadata?.metadata?.paragraphs || []).pop()?.end;
  return (data.extracted?.metadata?.metadata?.paragraphs || []).map((paragraph) => ({
    shortId: `${paragraph.start || 0}-${paragraph.end || 0}`,
    text: hasUnicodeCharacters
      ? sliceUnicode(text, paragraph.start, paragraph.end).trim()
      : text.slice(paragraph.start, paragraph.end).trim(),
  }));
}

export const NEWLINE_REGEX = /\n/g;

export const getNavigationUrl = (
  navigateToFile: boolean,
  navigateToLink: boolean,
  resource: IResource,
  field: ResourceField,
) => {
  const url = getExternalUrl(resource, field);
  const isFile = field.field_type === FIELD_TYPE.file;
  if (url && navigateToLink && !isYoutubeUrl(url)) {
    return of(url);
  } else if (isFile && navigateToFile) {
    if (url) {
      return of(url);
    } else {
      const fileUrl = (field as FileFieldData)?.value?.file?.uri;
      return fileUrl ? getFileUrls([fileUrl], true).pipe(map((urls) => urls[0])) : of(undefined);
    }
  } else {
    return of(undefined);
  }
};

export const getExternalUrl = (resource: IResource, field?: ResourceField) => {
  if (field?.field_type === FIELD_TYPE.link) {
    return (field.value as LinkField).uri;
  } else if (field?.field_type === FIELD_TYPE.file && (field.value as FileField)?.external) {
    return (field.value as FileField).file?.uri;
  } else if (resource.origin?.url) {
    return resource.origin.url;
  } else {
    return undefined;
  }
};

export function getFieldIdWithShortType(fullId: FieldFullId): string {
  return `${longToShortFieldType(fullId.field_type)}/${fullId.field_id}`;
}

export function getFindParagraphs(results: Search.FindResults, fullId: FieldFullId): Search.FindParagraph[] {
  return Object.values(
    results.resources?.[fullId.resourceId]?.fields[`/${getFieldIdWithShortType(fullId)}`]?.paragraphs || {},
  );
}
