import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, HttpBackend, HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateLoader, TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { OverlayModule } from '@angular/cdk/overlay';
import { PaToastModule } from '@guillotinaweb/pastanaga-angular';

import { BackendConfigurationService, STFConfigModule, STFPipesModule } from '@flaps/core';
import { environment } from '../environments/environment';

// App modules
import { AppRoutingModule } from './app-routing.module';
import { FarewellModule } from './farewell/farewell.module';
import { AccountModule } from './account/account.module';

// Components
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
  LabelSetsModule,
  SelectAccountKbModule,
  TopbarModule,
  UploadModule,
} from '@flaps/common';
import { KnowledgeBoxModule } from './knowledge-box';
import { InviteModule } from './invite/invite.module';
import { MultiTranslateHttpLoader } from 'ngx-translate-multi-http-loader';
import { SyncService } from '@nuclia/sync';
import { NewSyncService } from '../../../../libs/sync/src/lib/sync/new-sync.service';

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
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    TranslatePipe,
    // TO BE REMOVED WHEN DESKTOP APP IS GONE
    // override SyncService with NewSyncService to use the new agent API
    { provide: SyncService, useClass: NewSyncService },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
