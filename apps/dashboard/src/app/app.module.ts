import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateLoader, TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FlexLayoutModule } from '@angular/flex-layout';
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
import { registerLocaleData } from '@angular/common';
import { RedirectModule } from './redirect/redirect.module';
import { SearchModule } from './search/search.module';
import {
  AuthInterceptor,
  BaseModule,
  EntitiesModule,
  LabelSetsModule,
  SelectAccountKbModule,
  TopbarModule,
  UploadModule,
} from '@flaps/common';
import { KnowledgeBoxModule } from './knowledge-box/knowledge-box.module';

registerLocaleData(localeEn);
registerLocaleData(localeEs);
registerLocaleData(localeCa);

export function createTranslateLoader(http: HttpClient, config: BackendConfigurationService) {
  return new TranslateHttpLoader(http, 'assets/i18n/', `.json?version=${config.getVersion()}`);
}

const components = [AppComponent];

const appModules = [
  AppRoutingModule,
  FarewellModule,
  SelectAccountKbModule,
  AccountModule,
  KnowledgeBoxModule,
  EntitiesModule,
  LabelSetsModule,
  UploadModule,
  RedirectModule,
  SearchModule,
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
    FlexLayoutModule,
    STFConfigModule.forRoot(environment),
    OverlayModule,
    STFPipesModule,
    TopbarModule,
    ...appModules,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient, BackendConfigurationService],
      },
    }),
    PaToastModule,
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }, TranslatePipe],
  bootstrap: [AppComponent],
})
export class AppModule {}
