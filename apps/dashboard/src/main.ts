import { OverlayModule } from '@angular/cdk/overlay';
import { registerLocaleData } from '@angular/common';
import { HttpBackend, provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { enableProdMode, importProvidersFrom, provideAppInitializer } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TitleStrategy } from '@angular/router';
import { BaseModule, EntitiesModule, SelectAccountKbModule, TopbarModule, UploadModule } from '@flaps/common';
import { BackendConfigurationService, LabelSetsModule, STFConfigModule, STFPipesModule } from '@flaps/core';
import { PaToastModule, SPRITE_CACHE_VERSION } from '@guillotinaweb/pastanaga-angular';
import { TranslateLoader, TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { FarewellModule } from '@nuclia/user';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { MultiTranslateHttpLoader } from 'ngx-translate-multi-http-loader';
import { AppRoutingModule } from './app/app-routing.module';
import { AppTitleStrategy } from './app/app-title.strategy';
import { AppComponent } from './app/app.component';
import { checkExternalConnection } from './app/app.init';
import { KnowledgeBoxModule } from './app/knowledge-box';
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
import localeFr from '@angular/common/locales/fr';
registerLocaleData(localeEn);
registerLocaleData(localeEs);
registerLocaleData(localeCa);
registerLocaleData(localeFr);

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      BaseModule,
      BrowserModule,
      BrowserAnimationsModule,
      ReactiveFormsModule,
      AngularSvgIconModule.forRoot(),
      STFConfigModule.forRoot(environment),
      OverlayModule,
      STFPipesModule,
      TopbarModule,
      AppRoutingModule,
      FarewellModule,
      SelectAccountKbModule,
      KnowledgeBoxModule,
      EntitiesModule,
      LabelSetsModule,
      UploadModule,
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpBackend, BackendConfigurationService],
        },
      }),
      PaToastModule,
    ),
    provideAppInitializer(checkExternalConnection),
    {
      provide: SPRITE_CACHE_VERSION,
      useFactory: (config: BackendConfigurationService) => config.getVersion(),
      deps: [BackendConfigurationService],
    },
    TranslatePipe,
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    provideHttpClient(withXhr(), withInterceptorsFromDi()),
  ],
}).catch((err) => console.error(err));
