import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { TranslateLoader, TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { HttpBackend, HttpClientModule } from '@angular/common/http';
import { BackendConfigurationService, STFConfigModule } from '@flaps/core';
import { APP_BASE_HREF, registerLocaleData } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { environment } from '../environments/environment';
import { RouterModule, TitleStrategy } from '@angular/router';
import { routerOptions, routes } from './app-routing';
import { HomePageComponent } from './home/home-page.component';
import { MainContainerComponent } from './home/main-container/main-container.component';
import { PaIconModule, PaTranslateModule } from '@guillotinaweb/pastanaga-angular';

// Load locales
import localeEn from '@angular/common/locales/en';
import localeEs from '@angular/common/locales/es';
import localeCa from '@angular/common/locales/ca';
import { MultiTranslateHttpLoader } from 'ngx-translate-multi-http-loader';
import { HomeContainerComponent } from '@nuclia/sistema';
import { AppTitleStrategy } from './app-title.strategy';

registerLocaleData(localeEn);
registerLocaleData(localeEs);
registerLocaleData(localeCa);

export function createTranslateLoader(http: HttpBackend, config: BackendConfigurationService) {
  const suffix = `.json?version=${config.getVersion()}`;
  return new MultiTranslateHttpLoader(http, [
    { prefix: 'assets/i18n/user/', suffix },
    { prefix: 'assets/i18n/common/', suffix },
    { prefix: 'assets/i18n/sync/', suffix },
  ]);
}

@NgModule({
  declarations: [AppComponent, HomePageComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
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
    HomeContainerComponent,
    MainContainerComponent,
    // PaTranslateModule needs to be imported in the root module for pa-datetime to work
    PaTranslateModule,
  ],
  providers: [
    TranslatePipe,
    { provide: APP_BASE_HREF, useValue: '/admin' },
    { provide: TitleStrategy, useClass: AppTitleStrategy },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
