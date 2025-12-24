import {
  FIELD_TYPE,
  type FieldFullId,
  type FieldId,
  type FileField,
  FileFieldData,
  getWidgetParameters,
  type IFieldData,
  type IResource,
  type LinkField,
  longToShortFieldType,
  Nuclia,
  NUCLIA_STANDARD_SEARCH_CONFIG,
  NUCLIA_STANDARD_SEARCH_CONFIG_ID,
  type NucliaOptions,
  type ResourceField,
  Search,
  sliceUnicode,
  type TextFieldFormat,
  type Widget,
} from '@nuclia/core';
import { from, map, Observable, of } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import { switchMap } from 'rxjs/operators';
import { getFileUrls } from './api';
import type { DisplayableMetadata, ResultMetadata, ResultMetadataItem, TypedResult } from './models';

let CDN = import.meta.env.VITE_CDN || 'https://cdn.rag.progress.cloud/';
export const setCDN = (cdn: string) => (CDN = cdn);
export const getCDN = () => CDN;
// the vendor CDN does not need to be customized
export const getVendorsCDN = () => 'https://cdn.rag.progress.cloud/vendors';

export const loadFonts = () => {
  const fontLinkId = 'nuclia-fonts-link';
  if (!document.getElementById(fontLinkId)) {
    const font = document.createElement('link');
    font.id = fontLinkId;
    font.href = 'https://cdn.rag.progress.cloud/fonts/inter.css';
    font.rel = 'stylesheet';

    const head = document.head || document.getElementsByTagName('head')[0];
    head.appendChild(font);
  }
};

export const loadSvgSprite = () => {
  return fromFetch(`${getCDN()}icons/glyphs-sprite.svg`).pipe(switchMap((res) => res.text()));
};

export const getPdfJsStyle = () => {
  return from(
    fetch(`${getVendorsCDN()}/pdf_viewer.css`).then(function (response) {
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

const sizeUnits = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
export function formatSize(bytes: number): string {
  if (isNaN(parseFloat(String(bytes))) || !isFinite(bytes)) {
    return '?';
  }

  let unit = 0;

  while (bytes >= 1024) {
    bytes /= 1024;
    unit++;
  }
  let precision = 2;
  if (unit === 0) {
    precision = 0;
  }
  return `${bytes.toFixed(precision)} ${sizeUnits[unit]}`;
}

export const formatQueryKey = (key: string): string => {
  return `__nuclia_${key}__`;
};

export const queryKey = formatQueryKey('query');
export const filterKey = formatQueryKey('filter');
export const previewKey = formatQueryKey('preview');
export const paragraphKey = formatQueryKey('paragraph');
export const creationStartKey = formatQueryKey('creationStart');
export const creationEndKey = formatQueryKey('creationEnd');

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

export function hasPermalinkToRender(): boolean {
  const urlParams = getUrlParams();
  return !!urlParams.get(previewKey) || !!urlParams.get(queryKey);
}

export const getPreviewParam = (resourceId: string, field: FieldId) => {
  return `${resourceId}|${field.field_type}|${field.field_id}`;
};

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

export const entitiesDefaultColor = '#e6e6e6';

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

export function goToUrl(url: string, newTab = false) {
  const urlObject = new URL(url);
  if (urlObject.protocol.startsWith('http')) {
    window.open(url, newTab ? '_blank' : '_self');
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
  const paragraphs = data.extracted?.metadata?.metadata?.paragraphs || [];
  const hasUnicodeCharacters = text.length > 0 && text.length !== paragraphs[paragraphs.length - 1]?.end;
  return paragraphs.map((paragraph) => ({
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
  navigateToOriginURL: boolean,
  openNewTab: boolean,
  permalink: boolean,
  previewBaseUrl: string,
  resource: IResource,
  field?: ResourceField,
  paragraph?: Search.FindParagraph,
): Observable<string | undefined> => {
  const url = getExternalUrl(resource, navigateToOriginURL, field);
  if (url && navigateToOriginURL) {
    return of(url);
  } else {
    const isFile = field.field_type === FIELD_TYPE.file;
    if (url && navigateToLink && !isYoutubeUrl(url)) {
      const supportsTextFragments = 'fragmentDirective' in document;
      if (paragraph?.text && supportsTextFragments && !new URL(url).hash) {
        const textFragment = getTextFragment(paragraph.text);
        if (textFragment) {
          return of(url + textFragment);
        }
      }
      return of(url);
    } else if (isFile && navigateToFile) {
      if (url) {
        return of(url);
      } else {
        const fileUrl = (field as FileFieldData)?.value?.file?.uri;
        return fileUrl ? getFileUrls([fileUrl], true).pipe(map((urls) => urls[0])) : of(undefined);
      }
    } else if (openNewTab && (permalink || previewBaseUrl)) {
      return of(getPreviewUrl(resource.id, field, paragraph, previewBaseUrl));
    } else {
      return of(undefined);
    }
  }
};

export const getExternalUrl = (resource: IResource, navigateToOriginURL: boolean, field?: ResourceField) => {
  if (navigateToOriginURL && resource.origin?.url) {
    return resource.origin.url;
  } else {
    if (field?.field_type === FIELD_TYPE.link) {
      return (field.value as LinkField).uri;
    } else if (field?.field_type === FIELD_TYPE.file && (field.value as FileField)?.external) {
      return (field.value as FileField).file?.uri;
    } else if (resource.origin?.url) {
      return resource.origin.url;
    } else {
      return undefined;
    }
  }
};

export const getPreviewUrl = (
  resourceId: string,
  field: FieldId,
  paragraph?: Search.FindParagraph,
  previewBaseUrl?: string,
) => {
  const previewParam = getPreviewParam(resourceId, field);
  const params = getUrlParams();
  params.delete(queryKey);
  params.delete(filterKey);
  params.delete(creationStartKey);
  params.delete(creationEndKey);
  params.set(previewKey, previewParam);
  if (paragraph) {
    params.set(paragraphKey, paragraph?.id.split('/').pop() || '');
  }
  const baseUrl = previewBaseUrl || `${location.origin}${location.pathname}${location.hash.split('?')[0]}`;
  return params ? `${baseUrl}?${params}` : baseUrl;
};

export function getFieldIdWithShortType(fullId: FieldFullId): string {
  return `${longToShortFieldType(fullId.field_type)}/${fullId.field_id}`;
}

export function getFindParagraphs(results: Search.FindResults, fullId: FieldFullId): Search.FindParagraph[] {
  return Object.values(
    results.resources?.[fullId.resourceId]?.fields[`/${getFieldIdWithShortType(fullId)}`]?.paragraphs || {},
  );
}

export function injectCustomCss(cssPath: string, element: HTMLElement) {
  if (cssPath) {
    fetch(cssPath)
      .then((res) => res.text())
      .then((css) => {
        const style = document.createElement('style');
        style.innerHTML = css;
        element.getRootNode().appendChild(style);
      });
  }
}

export function downloadAsJSON(data: any) {
  downloadFile(`dump-${new Date().toISOString()}.json`, 'application/json', JSON.stringify(data));
}

export function downloadFile(filename: string, mime: string, data: string) {
  const element = document.createElement('a');
  element.setAttribute('href', `data:${mime};charset=utf-8,` + encodeURIComponent(data));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  element.click();
}

export function getFormatInfos(format: TextFieldFormat) {
  let mime;
  let ext;
  switch (format) {
    case 'MARKDOWN':
    case 'KEEP_MARKDOWN':
      mime = 'text/markdown';
      ext = 'md';
      break;
    case 'HTML':
      mime = 'text/html';
      ext = 'html';
      break;
    case 'RST':
      mime = 'text/x-rst';
      ext = 'rst';
      break;
    case 'JSON':
      mime = '	application/json';
      ext = 'json';
      break;
    default:
      mime = 'text/plain';
      ext = 'txt';
  }
  return { mime, ext };
}

export function getThumbnailInfos(result: TypedResult) {
  let fallback = '';
  let isPlayable = false;
  switch (result.resultType) {
    case 'audio':
      fallback = 'audio';
      isPlayable = true;
      break;
    case 'conversation':
      fallback = 'chat';
      break;
    case 'image':
      fallback = 'image';
      break;
    case 'pdf':
      fallback = result.resultIcon;
      break;
    case 'spreadsheet':
      fallback = 'spreadsheet';
      break;
    case 'text':
      fallback = 'file';
      break;
    case 'video':
      fallback = 'play';
      isPlayable = true;
      break;
  }
  return { fallback, isPlayable };
}

const block = (text: { text: string }) => {
  return text.text + '\n\n';
};
const line = (text: { text: string }) => {
  return text.text + '\n';
};
const inline = (text: { text: string }) => {
  return text.text;
};
const newline = () => '\n';
const empty = () => '';

const TxtRenderer = {
  // Block elements
  space: empty,
  code: block,
  blockquote: block,
  html: empty,
  heading: block,
  hr: newline,
  list: (data: { items: { text: string }[] }) => data.items.map((item) => line(item)).join('\n'),
  listitem: line,
  checkbox: empty,
  paragraph: block,
  table: (data: { header: { text: string }[]; rows: { text: string }[][] }) =>
    data.header
      .map((header) => header)
      .concat(data.rows.reduce((acc, row) => acc.concat(row), []))
      .map(inline)
      .join('\n'),
  tablerow: line,
  tablecell: line,
  // Inline elements
  strong: inline,
  em: inline,
  codespan: inline,
  br: newline,
  del: inline,
  link: inline,
  image: inline,
  text: inline,
  // etc.
  options: {},
};

export function markdownToTxt(markdown: string): string {
  if (!marked) {
    return markdown;
  }
  return marked.marked(markdown, { renderer: TxtRenderer });
}

export function loadWidgetConfig(id: string, options: NucliaOptions) {
  if (!options.account || !options.knowledgeBox || !options.zone) {
    console.error('Account id, Knowledge Box id and zone must be provided to load the widget configuration');
    return of({});
  }
  return new Nuclia(options).db.getKnowledgeBox(options.account, options.knowledgeBox, options.zone).pipe(
    map((kb) => {
      const widget = (kb.search_configs?.['widgets'] || []).find((widget: Widget.Widget) => widget.slug === id);
      if (!widget) {
        console.error(`Widget not found: "${id}"`);
        return of({});
      }
      let searchConfig;
      if (widget.searchConfigId === NUCLIA_STANDARD_SEARCH_CONFIG_ID) {
        searchConfig = NUCLIA_STANDARD_SEARCH_CONFIG;
      } else {
        searchConfig = (kb.search_configs?.['searchConfigurations'] || []).find(
          (config: Widget.SearchConfiguration) => config.id === widget.searchConfigId,
        );
      }
      if (!searchConfig) {
        console.error(`Search configuration not found: "${widget.searchConfigId}"`);
        return of({});
      }
      const params = getWidgetParameters(searchConfig, widget.widgetConfig);
      return Object.fromEntries(Object.entries(params).filter(([_, value]) => value !== null && value !== ''));
    }),
  );
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => acc && acc[key], obj);
}

function getMetadata(metadata: ResultMetadataItem[], obj: any): DisplayableMetadata[] {
  if (!obj) {
    return [];
  }
  const metadataValues: DisplayableMetadata[] = [];
  metadata.forEach(({ path, type, title }) => {
    const value = getNestedValue(obj, path);
    const label = path.split('.').pop() || path;
    if (value) {
      metadataValues.push({ label, value, type, title });
    }
  });
  return metadataValues;
}

export function getResultMetadata(metadata: ResultMetadata, resource: IResource, field: IFieldData | undefined) {
  const metadataValues: DisplayableMetadata[] = [];
  if (metadata.origin.length > 0) {
    metadataValues.push(...getMetadata(metadata.origin, resource.origin));
  }
  if (metadata.field.length > 0) {
    metadataValues.push(...getMetadata(metadata.field, field?.value));
  }
  if (metadata.extra.length > 0) {
    metadataValues.push(...getMetadata(metadata.extra, resource.extra?.metadata));
  }
  return metadataValues;
}

function supportsCSSNesting() {
  // Check for css nesting support as some Safari version do ot support it
  const style = document.createElement('style');
  style.textContent = `
    div {
      & pre {
        color: black;
      }
    }
  `;
  document.head.appendChild(style);
  const isSupported = style.sheet && style.sheet.cssRules.length > 0;
  document.head.removeChild(style);
  return !!isSupported;
}

export const isBrowserUnsupported = !supportsCSSNesting();
