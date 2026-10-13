import { signal } from '@angular/core';
import { ITranslateService, Language, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

const keyToString = (key: string | string[] | (() => string | string[])): string => {
  const value = typeof key === 'function' ? key() : key;
  return Array.isArray(value) ? value.join(',') : value;
};

const fakeTranslateService: Partial<ITranslateService> = {
  currentLang: signal<Language | null>('en'),
  fallbackLang: signal<Language | null>('en'),
  translate: (key) => signal(keyToString(key)),
  instant: (key) => keyToString(key),
  get: (key) => of(keyToString(key)),
};

export const translateTestProviders = [
  { provide: TranslateService, useValue: fakeTranslateService as unknown as TranslateService },
];
