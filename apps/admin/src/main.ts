import { enableProdMode, importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';

import { OverlayModule } from '@angular/cdk/overlay';
import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication, BrowserModule } from '@angular/platform-browser';
import { TitleStrategy } from '@angular/router';
import { BaseModule, EntitiesModule, SelectAccountKbModule, TopbarModule, UploadModule } from '@flaps/common';
import { BackendConfigurationService, LabelSetsModule, STFConfigModule, STFPipesModule } from '@flaps/core';
import { PaToastModule, SPRITE_CACHE_VERSION } from '@guillotinaweb/pastanaga-angular';
import { provideTranslateService, TranslatePipe } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { FarewellModule } from '@nuclia/user';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { AppRoutingModule } from './app/app-routing.module';
import { AppTitleStrategy } from './app/app-title.strategy';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

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
      ReactiveFormsModule,
      AngularSvgIconModule.forRoot(),
      STFConfigModule.forRoot(environment),
      OverlayModule,
      STFPipesModule,
      TopbarModule,
      AppRoutingModule,
      FarewellModule,
      SelectAccountKbModule,
      EntitiesModule,
      LabelSetsModule,
      UploadModule,
      PaToastModule,
    ),
    {
      provide: SPRITE_CACHE_VERSION,
      useFactory: (config: BackendConfigurationService) => config.getVersion(),
      deps: [BackendConfigurationService],
    },
    TranslatePipe,
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    provideHttpClient(withInterceptorsFromDi()),
    provideZonelessChangeDetection(),
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
