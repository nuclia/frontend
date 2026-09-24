import { enableProdMode, importProvidersFrom } from '@angular/core';

import { APP_BASE_HREF, registerLocaleData } from '@angular/common';
import { HttpBackend, provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import localeCa from '@angular/common/locales/ca';
import localeEn from '@angular/common/locales/en';
import localeEs from '@angular/common/locales/es';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, TitleStrategy } from '@angular/router';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { BackendConfigurationService, STFConfigModule } from '@flaps/core';
import { PaIconModule, PaTranslateModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateLoader, TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { MultiTranslateHttpLoader } from 'ngx-translate-multi-http-loader';
import { routerOptions, routes } from './app/app-routing';
import { AppTitleStrategy } from './app/app-title.strategy';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

function createTranslateLoader(http: HttpBackend, config: BackendConfigurationService) {
  const suffix = `.json?version=${config.getVersion()}`;
  return new MultiTranslateHttpLoader(http, [
    { prefix: 'assets/i18n/user/', suffix },
    { prefix: 'assets/i18n/common/', suffix },
    { prefix: 'assets/i18n/sync/', suffix },
  ]);
}
registerLocaleData(localeEn);
registerLocaleData(localeEs);
registerLocaleData(localeCa);

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      BrowserModule,
      BrowserAnimationsModule,
      AngularSvgIconModule.forRoot(),
      STFConfigModule.forRoot(environment),
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpBackend, BackendConfigurationService],
        },
      }),
      RouterModule.forRoot(routes, routerOptions),
      PaIconModule,
      // PaTranslateModule needs to be imported in the root module for pa-datetime to work
      PaTranslateModule,
    ),
    TranslatePipe,
    { provide: APP_BASE_HREF, useValue: '/admin' },
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    provideHttpClient(withXhr(), withInterceptorsFromDi()),
  ],
}).catch((err) => console.error(err));
