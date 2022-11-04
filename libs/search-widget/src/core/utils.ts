import { fromFetch } from 'rxjs/fetch';
import { switchMap } from 'rxjs/operators';

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

export const getPdfJsBaseUrl = (folder = 'build') => {
  return `https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/${folder}`;
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

export function goToUrl(url: string) {
  const urlObject = new URL(url);
  if (urlObject.protocol.startsWith('http')) {
    window.location.href = url;
  } else {
    console.info(`Invalid URL: ${url}`);
  }
}
