import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateLoader, TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import { TourMatMenuModule } from 'ngx-ui-tour-md-menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { PaToastModule } from '@guillotinaweb/pastanaga-angular';

import { BackendConfigurationService, STFConfigModule, STFPipesModule } from '@flaps/core';
import { AuthInterceptor } from './guards/auth.interceptor';
import { environment } from '../environments/environment';

// App modules
import { AppRoutingModule } from './app-routing.module';
import { SetupModule } from './setup/setup.module';
import { SelectModule } from './select/select.module';
import { AccountModule } from './account/account.module';
import { KnowledgeBoxModule } from './knowledge-box/knowledge-box.module';
import { EntitiesModule } from './entities/entities.module';
import { OntologiesModule } from './ontologies/ontologies.module';
import { UploadModule } from './upload/upload.module';

// Components
import { AppComponent } from './app.component';
import { BaseComponent } from './base/base.component';
import { TopbarModule } from './components/topbar/topbar.module';

// Load locales
import localeEn from '@angular/common/locales/en';
import localeEs from '@angular/common/locales/es';
import localeCa from '@angular/common/locales/ca';
import { registerLocaleData } from '@angular/common';
import { RedirectModule } from './redirect/redirect.module';

registerLocaleData(localeEn);
registerLocaleData(localeEs);
registerLocaleData(localeCa);

export function createTranslateLoader(http: HttpClient, config: BackendConfigurationService) {
  return new TranslateHttpLoader(http, 'assets/i18n/', `.json?version=${config.getVersion()}`);
}

const components = [AppComponent, BaseComponent];

const appModules = [
  AppRoutingModule,
  SetupModule,
  SelectModule,
  AccountModule,
  KnowledgeBoxModule,
  EntitiesModule,
  OntologiesModule,
  UploadModule,
  RedirectModule,
];

@NgModule({
  declarations: [...components],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    AngularSvgIconModule.forRoot(),
    FlexLayoutModule,
    STFConfigModule.forRoot(environment),
    TourMatMenuModule.forRoot(),
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
