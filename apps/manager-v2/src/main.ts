import { importProvidersFrom } from '@angular/core';

import { registerLocaleData } from '@angular/common';
import { HttpBackend } from '@angular/common/http';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { BackendConfigurationService, STFConfigModule } from '@flaps/core';
import { PaAvatarModule, PaDropdownModule, PaPopupModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateLoader, TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { MultiTranslateHttpLoader } from 'ngx-translate-multi-http-loader';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';
import { environment } from './environments/environment';

function createTranslateLoader(http: HttpBackend, config: BackendConfigurationService) {
  const suffix = `.json?version=${config.getVersion()}`;
  return new MultiTranslateHttpLoader(http, [
    { prefix: 'assets/i18n/user/', suffix },
    { prefix: 'assets/i18n/common/', suffix },
    { prefix: 'assets/i18n/sync/', suffix },
  ]);
}

import localeCa from '@angular/common/locales/ca';
import localeEn from '@angular/common/locales/en';
import localeEs from '@angular/common/locales/es';
registerLocaleData(localeEn);
registerLocaleData(localeEs);
registerLocaleData(localeCa);

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      BrowserModule,
      STFConfigModule.forRoot(environment),
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpBackend, BackendConfigurationService],
        },
      }),
      AngularSvgIconModule.forRoot(),
      PaAvatarModule,
      PaDropdownModule,
      PaPopupModule,
    ),
    TranslatePipe,
    provideRouter(appRoutes, withEnabledBlockingInitialNavigation()),
  ],
}).catch((err) => console.error(err));
