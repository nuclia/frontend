import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';

import { registerLocaleData } from '@angular/common';
import { bootstrapApplication, BrowserModule } from '@angular/platform-browser';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { STFConfigModule } from '@flaps/core';
import { provideTranslateService, TranslatePipe } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideHlmDatePickerConfig } from '@nuclia/ui-spartan/date-picker';
import { provideBrnCalendarI18n } from '@spartan-ng/brain/calendar';
import { provideNativeDateAdapter } from '@spartan-ng/brain/date-time';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';
import { environment } from './environments/environment';

import localeCa from '@angular/common/locales/ca';
import localeEn from '@angular/common/locales/en';
import localeEs from '@angular/common/locales/es';
registerLocaleData(localeEn);
registerLocaleData(localeEs);
registerLocaleData(localeCa);

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(BrowserModule, STFConfigModule.forRoot(environment)),
    TranslatePipe,
    provideRouter(appRoutes, withEnabledBlockingInitialNavigation()),
    provideZonelessChangeDetection(),
    provideNativeDateAdapter(),
    provideBrnCalendarI18n(),
    provideHlmDatePickerConfig<Date>({
      autoCloseOnSelect: true,
      formatDate: (date) => date.toLocaleDateString('en', { dateStyle: 'long' }),
      formatInputDate: (date) => date.toLocaleDateString('en', { dateStyle: 'long' }),
    }),
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        resources: [
          { prefix: 'assets/i18n/user/', suffix: '.json' },
          { prefix: 'assets/i18n/common/', suffix: '.json' },
          { prefix: 'assets/i18n/sync/', suffix: '.json' },
        ],
        enforceLoading: true,
        useHttpBackend: true,
      }),
    }),
  ],
}).catch((err) => console.error(err));
