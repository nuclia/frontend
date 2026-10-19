import { enableProdMode, importProvidersFrom } from '@angular/core';

import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { I18N_EN, PA_LANG, PaButtonModule, PaSideNavModule, PaTranslateModule } from '@guillotinaweb/pastanaga-angular';
import { DEMO_LA, PaDemoModule } from '@guillotinaweb/pastanaga-angular/demo';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { AppRoutingModule } from './app/app-routing.module';
import { AppComponent } from './app/app.component';
import { SistemaPagesModule } from './app/sistema-pages/sistema-pages.module';
import { environment } from './environments/environment';

const GENERIC_TRANSLATIONS = {
  generic: {
    back: 'Back',
    cancel: 'Cancel',
    edit: 'Edit',
  },
};

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      BrowserModule,
      AppRoutingModule,
      AngularSvgIconModule.forRoot(),
      PaDemoModule,
      PaButtonModule,
      PaSideNavModule,
      PaTranslateModule.addTranslations([{ en_US: I18N_EN }, { latin: DEMO_LA }, { en_US: GENERIC_TRANSLATIONS }]),
      SistemaPagesModule,
    ),
    { provide: PA_LANG, useValue: 'en_US' },
  ],
}).catch((err) => console.error(err));
