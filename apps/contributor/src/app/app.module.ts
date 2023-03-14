import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { TranslateLoader, TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { BackendConfigurationService, STFConfigModule } from '@flaps/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { registerLocaleData } from '@angular/common';

// Load locales
import localeEn from '@angular/common/locales/en';
import localeEs from '@angular/common/locales/es';
import localeCa from '@angular/common/locales/ca';
import { environment } from '../environments/environment';

registerLocaleData(localeEn);
registerLocaleData(localeEs);
registerLocaleData(localeCa);

export function createTranslateLoader(http: HttpClient, config: BackendConfigurationService) {
  return new TranslateHttpLoader(http, 'assets/i18n/', `.json?version=${config.getVersion()}`);
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AngularSvgIconModule.forRoot(),
    RouterModule.forRoot([], { initialNavigation: 'enabledBlocking' }),
    STFConfigModule.forRoot(environment),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient, BackendConfigurationService],
      },
    }),
    PaIconModule,
  ],
  providers: [TranslatePipe],
  bootstrap: [AppComponent],
})
export class AppModule {}
