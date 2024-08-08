import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, HttpBackend, HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateLoader, TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { OverlayModule } from '@angular/cdk/overlay';
import { PaToastModule, SPRITE_CACHE_VERSION } from '@guillotinaweb/pastanaga-angular';

import { BackendConfigurationService, LabelSetsModule, STFConfigModule, STFPipesModule } from '@flaps/core';
import { environment } from '../environments/environment';

import { AppRoutingModule } from './app-routing.module';
import { FarewellModule } from './farewell/farewell.module';
import { AccountModule } from './account/account.module';
import { AppComponent } from './app.component';

// Load locales
import localeEn from '@angular/common/locales/en';
import localeEs from '@angular/common/locales/es';
import localeCa from '@angular/common/locales/ca';
import localeFr from '@angular/common/locales/fr';
import { registerLocaleData } from '@angular/common';
import { RedirectModule } from './redirect/redirect.module';
import {
  AuthInterceptor,
  BaseModule,
  EntitiesModule,
  SelectAccountKbModule,
  TopbarModule,
  UploadModule,
} from '@flaps/common';
import { KnowledgeBoxModule } from './knowledge-box';
import { InviteModule } from './onboarding/invite/invite.module';
import { MultiTranslateHttpLoader } from 'ngx-translate-multi-http-loader';
import { TitleStrategy } from '@angular/router';
import { AppTitleStrategy } from './app-title.strategy';

registerLocaleData(localeEn);
registerLocaleData(localeEs);
registerLocaleData(localeCa);
registerLocaleData(localeFr);

export function createTranslateLoader(http: HttpBackend, config: BackendConfigurationService) {
  const suffix = `.json?version=${config.getVersion()}`;
  return new MultiTranslateHttpLoader(http, [
    { prefix: 'assets/i18n/user/', suffix },
    { prefix: 'assets/i18n/common/', suffix },
    { prefix: 'assets/i18n/sync/', suffix },
  ]);
}

const components = [AppComponent];

const appModules = [
  AppRoutingModule,
  FarewellModule,
  InviteModule,
  SelectAccountKbModule,
  AccountModule,
  KnowledgeBoxModule,
  EntitiesModule,
  LabelSetsModule,
  UploadModule,
  RedirectModule,
];

@NgModule({
  declarations: [...components],
  imports: [
    BaseModule,
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    AngularSvgIconModule.forRoot(),
    STFConfigModule.forRoot(environment),
    OverlayModule,
    STFPipesModule,
    TopbarModule,
    ...appModules,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpBackend, BackendConfigurationService],
      },
    }),
    PaToastModule,
  ],
  providers: [
    {
      provide: SPRITE_CACHE_VERSION,
      useFactory: (config: BackendConfigurationService) => config.getVersion(),
      deps: [BackendConfigurationService],
    },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    TranslatePipe,
    { provide: TitleStrategy, useClass: AppTitleStrategy },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
