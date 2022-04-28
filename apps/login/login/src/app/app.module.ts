import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { UserModule, userRoutes } from '@flaps/common';
import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { AppInitService, STFConfigModule } from '@flaps/auth';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { environment } from '../environments/environment';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, '/assets/i18n/', '.json');
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    UserModule,
    STFConfigModule.forRoot(environment),
    BrowserAnimationsModule,
    AngularSvgIconModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient],
      },
    }),
    RouterModule.forRoot(userRoutes, { initialNavigation: 'enabled', relativeLinkResolution: 'legacy' }),
  ],
  providers: [AppInitService],
  bootstrap: [AppComponent],
})
export class AppModule {}
