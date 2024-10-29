import type { Observable } from 'rxjs';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { getCDN } from './utils';

const _lang = 'en';

interface Translations {
  [lang: string]: TranslationEntries;
}

interface TranslationEntries {
  [key: string]: string;
}

export const currentLanguage = new BehaviorSubject<string>('en');

const locales = new BehaviorSubject<Translations>({});

const addTranslations = (lang: string, entries: TranslationEntries) => {
  const current = locales.getValue();
  locales.next({ ...current, [lang]: { ...(current[lang] || {}), ...entries } });
};

const loadTranslations = (lang: string) => {
  lang = lang.split('-')[0];
  return fetch(`${getCDN()}i18n/${lang}.json`)
    .then((res) => res.json())
    .then((entries) => addTranslations(lang, entries));
};

export const setLang = (lang: string) => {
  loadTranslations(lang).then(
    () => currentLanguage.next(lang),
    () => {
      if (lang !== 'en') {
        setLang('en');
      }
    },
  );
};

const HTML_TAG_DELIMITERS = new RegExp(/[<>]/gim);
const translate = (
  lang: string,
  translations: Translations,
  key: string,
  args?: { [key: string]: string | number },
) => {
  lang = lang.split('-')[0];
  let value = translations[lang]?.[key] || translations['en']?.[key];
  if (value && args) {
    Object.keys(args).forEach((param) => {
      let paramValue = args[param];
      if (typeof paramValue === 'string') {
        paramValue = paramValue.replace(HTML_TAG_DELIMITERS, (c) => '&#' + c.charCodeAt(0) + ';');
      }
      value = value.replace(new RegExp(`{{${param}}}`, 'g'), paramValue as string);
    });
  }
  return value || key;
};

export const _: Observable<(key: string, args?: { [key: string]: string | number }) => string> = combineLatest([
  currentLanguage,
  locales,
]).pipe(
  map(
    ([lang, translations]) =>
      (key: string, args?: { [key: string]: string | number }) =>
        translate(lang, translations, key, args),
  ),
);

export function translateInstant(key: string, args?: { [key: string]: string | number }): string {
  return translate(currentLanguage.getValue(), locales.getValue(), key, args);
}
