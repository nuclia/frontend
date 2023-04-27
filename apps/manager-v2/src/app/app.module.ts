import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { appRoutes } from './app.routes';
import { registerLocaleData } from '@angular/common';
import localeEn from '@angular/common/locales/en';
import localeEs from '@angular/common/locales/es';
import localeCa from '@angular/common/locales/ca';
import { HttpClient } from '@angular/common/http';
import { BackendConfigurationService, STFConfigModule } from '@flaps/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { environment } from '../environments/environment';
import { TranslateLoader, TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { PaAvatarModule, PaDropdownModule, PaPopupModule } from '@guillotinaweb/pastanaga-angular';
import { AppLayoutComponent } from './app-layout/app-layout.component';

registerLocaleData(localeEn);
registerLocaleData(localeEs);
registerLocaleData(localeCa);

export function createTranslateLoader(http: HttpClient, config: BackendConfigurationService) {
  return new TranslateHttpLoader(http, 'assets/i18n/', `.json?version=${config.getVersion()}`);
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
        deps: [HttpClient, BackendConfigurationService],
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
