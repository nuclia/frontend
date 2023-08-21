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
import { RouterModule } from '@angular/router';
import { routerOptions, routes } from './app-routing';
import { HomePageComponent } from './home/home-page.component';
import { MainContainerComponent } from './home/main-container/main-container.component';
import { UploadModule } from '@flaps/common';

// Load locales
import localeEn from '@angular/common/locales/en';
import localeEs from '@angular/common/locales/es';
import localeCa from '@angular/common/locales/ca';
import { MultiTranslateHttpLoader } from 'ngx-translate-multi-http-loader';

registerLocaleData(localeEn);
registerLocaleData(localeEs);
registerLocaleData(localeCa);

export function createTranslateLoader(http: HttpBackend, config: BackendConfigurationService) {
  const suffix = `.json?version=${config.getVersion()}`;
  return new MultiTranslateHttpLoader(http, [
    { prefix: 'assets/i18n/user/', suffix },
    { prefix: 'assets/i18n/common/', suffix },
  ]);
}

@NgModule({
  declarations: [AppComponent, HomePageComponent, MainContainerComponent],
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
    UploadModule,
  ],
  providers: [TranslatePipe, { provide: APP_BASE_HREF, useValue: '/contributor' }],
  bootstrap: [AppComponent],
})
export class AppModule {}
