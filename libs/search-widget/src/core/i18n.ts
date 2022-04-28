import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { getCDN } from './utils';

interface Translations {
  [lang: string]: TranslationEntries;
}
interface TranslationEntries {
  [key: string]: string;
}

const currentLanguage = new BehaviorSubject<string>('en');

const locales = new BehaviorSubject<Translations>({});

const addTranslations = (lang: string, entries: TranslationEntries) => {
  const current = locales.getValue();
  locales.next({ ...current, [lang]: { ...(current[lang] || {}), ...entries } });
};

const loadTranslations = (lang: string) =>
  fetch(`${getCDN()}i18n/${lang}.json`)
    .then((res) => res.json())
    .then((entries) => addTranslations(lang, entries));

export const setLang = (lang: string) => {
  loadTranslations(lang).then(
    () => currentLanguage.next(lang),
    () => {
      if (lang !== 'en') {
        setLang('en');
      }
    }
  );
};

const translate = (lang: string, translations: Translations, key: string) =>
  translations[lang]?.[key] || translations['en']?.[key] || key;

export const _ = combineLatest([currentLanguage, locales]).pipe(
  map(
    ([lang, translations]) =>
      (key: string) =>
        translate(lang, translations, key)
  )
);
