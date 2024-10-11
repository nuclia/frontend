import latinize from 'latinize';
import { map, Observable, of, Subject, take } from 'rxjs';
import { LearningConfigurations } from '@nuclia/core';
import DOMPurify from 'dompurify';

export const MIN_PASSWORD_LENGTH = 8;

export const DEFAULT_LANG = 'en';

const DATE_FORMATS: { [locale: string]: string } = {
  ca: 'dd/LL/yyyy',
  es: 'dd/LL/yyyy',
  'en-US': 'LL/dd/yyyy',
  fr: 'dd/LL/yyyy',
};

const INJECTED: string[] = [];

export function injectScript(url: string) {
  if (INJECTED.includes(url)) {
    return of(true);
  } else {
    const isInit: Subject<boolean> = new Subject();
    const script = window.document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.defer = true;
    script.src = url;
    script.onload = () => {
      INJECTED.push(url);
      isInit.next(true);
    };
    script.onerror = () => isInit.next(false);
    window.document.body.appendChild(script);

    return isInit.asObservable();
  }
}

export function getSemanticModels(
  semanticModelNames: string[],
  learningConfiguration: LearningConfigurations,
): string[] {
  const semanticModels: string[] = [];
  semanticModelNames.forEach((name) => {
    const semanticModel = learningConfiguration['semantic_model'].options?.find((model) => model.name === name);

    if (!semanticModel) {
      console.warn(`Semantic model ${name} not found.`);
    } else {
      semanticModels.push(semanticModel.value);
    }
  });

  return semanticModels;
}

export class STFUtils {
  public static generateRandomSlugSuffix(): string {
    return (Math.floor(Math.random() * 10000) + 4096).toString(16);
  }

  // Generate a slug from arbitrary text.
  // Slugs only have alphanumeric lowercase characters (a-z, 0-9) and separators (-_)
  public static generateSlug(text: string): string {
    if (!text) {
      return '';
    }

    // latinize characters when possible
    let slug = latinize(text);

    // Strip non allowed characters
    slug = slug.replace(/[^\w\s-_]+/g, '');

    // Replace white spaces
    slug = slug.trim();
    slug = slug.replace(/[\s]+/g, '-');

    if (!slug) {
      slug = crypto.randomUUID();
    }

    // To lowercase
    slug = slug.toLowerCase();

    return slug;
  }

  public static generateUniqueSlug(text: string, slugs: string[]): string {
    let slug = STFUtils.generateSlug(text);
    let i = 0;
    while (slugs.includes(slug)) {
      slug = STFUtils.generateSlug(text) + '-' + i;
      i++;
    }
    return slug;
  }

  // Download json
  public static downloadJson(content: any, filename: string) {
    const json = JSON.stringify(content);
    const a = document.createElement('a');
    const file = new Blob([json], { type: 'application/json' });
    a.href = URL.createObjectURL(file);
    a.download = filename;
    a.click();
  }

  public static get REGEX() {
    return {
      email:
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    };
  }

  // ISO 639-1 language codes
  public static languageList(): string[] {
    return [
      'aa',
      'ab',
      'af',
      'ak',
      'am',
      'an',
      'ar',
      'as',
      'av',
      'ay',
      'az',
      'ba',
      'be',
      'bg',
      'bh',
      'bi',
      'bm',
      'bn',
      'bo',
      'br',
      'bs',
      'ca',
      'ce',
      'ch',
      'co',
      'cr',
      'cs',
      'cu',
      'cv',
      'cy',
      'da',
      'de',
      'dv',
      'dz',
      'ee',
      'el',
      'en',
      'eo',
      'es',
      'et',
      'eu',
      'fa',
      'ff',
      'fi',
      'fj',
      'fo',
      'fr',
      'fy',
      'ga',
      'gd',
      'gl',
      'gn',
      'gu',
      'gv',
      'ha',
      'he',
      'hi',
      'ho',
      'hr',
      'ht',
      'hu',
      'hy',
      'hz',
      'ia',
      'id',
      'ie',
      'ig',
      'ii',
      'ik',
      'io',
      'is',
      'it',
      'iu',
      'ja',
      'jv',
      'ka',
      'kg',
      'ki',
      'kj',
      'kk',
      'kl',
      'km',
      'kn',
      'ko',
      'kr',
      'ks',
      'ku',
      'kv',
      'kw',
      'ky',
      'la',
      'lb',
      'lg',
      'li',
      'ln',
      'lo',
      'lt',
      'lv',
      'mg',
      'mh',
      'mi',
      'mk',
      'ml',
      'mn',
      'mo',
      'mr',
      'ms',
      'mt',
      'my',
      'na',
      'nd',
      'ne',
      'ng',
      'nl',
      'nn',
      'no',
      'nr',
      'nv',
      'ny',
      'oc',
      'oj',
      'om',
      'or',
      'os',
      'pa',
      'pi',
      'pl',
      'ps',
      'pt',
      'qu',
      'rm',
      'rn',
      'ro',
      'ru',
      'rw',
      'sa',
      'sc',
      'sd',
      'sg',
      'sh',
      'si',
      'sk',
      'sl',
      'sm',
      'sn',
      'so',
      'sq',
      'sr',
      'ss',
      'st',
      'su',
      'sv',
      'sw',
      'ta',
      'te',
      'tg',
      'th',
      'ti',
      'tk',
      'tl',
      'tn',
      'to',
      'tr',
      'ts',
      'tt',
      'tw',
      'ty',
      'ug',
      'uk',
      'ur',
      've',
      'vi',
      'vo',
      'wa',
      'wo',
      'xh',
      'yi',
      'yo',
      'za',
      'zh',
      'zu',
    ];
  }

  public static supportedLanguages() {
    return ['ca', 'es', 'en', 'fr'];
  }

  static getDateFormat(locale: string): string {
    return DATE_FORMATS[locale] ? DATE_FORMATS[locale] : DATE_FORMATS['en-US'];
  }

  public static supportedAudioLanguages() {
    return [
      'ca',
      'es',
      'en',
      'fr',
      'de',
      'it',
      'pt',
      'eu',
      'ru',
      'fi',
      'gl',
      'pl',
      'cs',
      'da',
      'el',
      'no',
      'sv',
      'tr',
      'ro',
      'hr',
      'nl',
    ];
  }
}

export function renderMarkdown(text: string): Observable<string> {
  return injectScript('//cdn.jsdelivr.net/npm/marked/marked.min.js').pipe(
    take(1),
    map(() => DOMPurify.sanitize((window as any)['marked'].parse(text, { mangle: false, headerIds: false }))),
  );
}
