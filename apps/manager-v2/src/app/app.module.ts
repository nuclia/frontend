import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { appRoutes } from './app.routes';
import { registerLocaleData } from '@angular/common';
import localeEn from '@angular/common/locales/en';
import localeEs from '@angular/common/locales/es';
import localeCa from '@angular/common/locales/ca';
import { HttpBackend } from '@angular/common/http';
import { BackendConfigurationService, STFConfigModule } from '@flaps/core';
import { environment } from '../environments/environment';
import { TranslateLoader, TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { PaAvatarModule, PaDropdownModule, PaPopupModule } from '@guillotinaweb/pastanaga-angular';
import { MultiTranslateHttpLoader } from 'ngx-translate-multi-http-loader';
import { AppLayoutComponent } from './app-layout/app-layout.component';

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
  declarations: [AppComponent, AppLayoutComponent],
  imports: [
    BrowserModule,
    RouterModule.forRoot(appRoutes, { initialNavigation: 'enabledBlocking' }),
    STFConfigModule.forRoot(environment),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpBackend, BackendConfigurationService],
      },
    }),
    AngularSvgIconModule.forRoot(),
    PaAvatarModule,
    PaDropdownModule,
    PaPopupModule,
  ],
  providers: [TranslatePipe],
  bootstrap: [AppComponent],
})
export class AppModule {}
