import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { STFConfigModule } from '@flaps/auth';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, 'assets/i18n/', '.json');
}

// Load locales
import localeEn from '@angular/common/locales/en';
import localeEs from '@angular/common/locales/es';
import localeCa from '@angular/common/locales/ca';
import { registerLocaleData } from '@angular/common';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { HomeModule } from './home/home.module';
import { MainLayoutModule } from './main-layout/main-layout.module';
import { UploadModule } from './upload/upload.module';
import { ConnectorsModule } from './connectors/connectors.module';
import { AccountModule } from './account/account.module';

registerLocaleData(localeEn);
registerLocaleData(localeEs);
registerLocaleData(localeCa);
@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserAnimationsModule,
    STFConfigModule.forRoot(environment),
    AngularSvgIconModule.forRoot(),
    AppRoutingModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient],
      },
    }),
    HomeModule,
    MainLayoutModule,
    UploadModule,
    ConnectorsModule,
    AccountModule,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
