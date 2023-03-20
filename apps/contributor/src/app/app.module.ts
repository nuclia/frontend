import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { TranslateLoader, TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { BackendConfigurationService, STFConfigModule } from '@flaps/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { registerLocaleData } from '@angular/common';
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

registerLocaleData(localeEn);
registerLocaleData(localeEs);
registerLocaleData(localeCa);

export function createTranslateLoader(http: HttpClient, config: BackendConfigurationService) {
  return new TranslateHttpLoader(http, 'assets/i18n/', `.json?version=${config.getVersion()}`);
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
        deps: [HttpClient, BackendConfigurationService],
      },
    }),
    RouterModule.forRoot(routes, routerOptions),
    UploadModule,
  ],
  providers: [TranslatePipe],
  bootstrap: [AppComponent],
})
export class AppModule {}
