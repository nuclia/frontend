import { fromFetch } from 'rxjs/fetch';
import { switchMap } from 'rxjs/operators';
import { from } from 'rxjs';
import type { Search } from '@nuclia/core';
import type { PreviewKind, WidgetParagraph } from './models';

let CDN = 'https://cdn.nuclia.cloud/';
export const setCDN = (cdn: string) => (CDN = cdn);
export const getCDN = () => CDN;

export const loadFonts = () => {
  const fontLinkId = 'nuclia-fonts-link';
  if (!document.getElementById(fontLinkId)) {
    const font = document.createElement('link');
    font.id = fontLinkId;
    font.href = 'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@300;400;700&display=swap';
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
  history.pushState(null, '', url);
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
