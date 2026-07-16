import { enableProdMode, provideZoneChangeDetection } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

const FONT_TEST_QUERY_PARAM = 'fontTest';
const FONT_TEST_STORAGE_KEY = 'dashboard.fontTest';
const PROGRESS_SANS_TEST_VALUE = 'progress-sans';

if (environment.production) {
  enableProdMode();
}

const requestedFontTest = new URLSearchParams(window.location.search).get(FONT_TEST_QUERY_PARAM);

if (requestedFontTest !== null) {
  if (requestedFontTest === PROGRESS_SANS_TEST_VALUE) {
    localStorage.setItem(FONT_TEST_STORAGE_KEY, requestedFontTest);
  } else {
    localStorage.removeItem(FONT_TEST_STORAGE_KEY);
  }
}

const savedFontTest = localStorage.getItem(FONT_TEST_STORAGE_KEY);

if (savedFontTest === PROGRESS_SANS_TEST_VALUE) {
  document.documentElement.dataset['fontTest'] = PROGRESS_SANS_TEST_VALUE;
} else {
  delete document.documentElement.dataset['fontTest'];
}

platformBrowserDynamic()
  .bootstrapModule(AppModule, { applicationProviders: [provideZoneChangeDetection()] })
  .catch((err) => console.error(err));
