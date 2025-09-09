import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { I18N_EN, PA_LANG, PaButtonModule, PaSideNavModule, PaTranslateModule } from '@guillotinaweb/pastanaga-angular';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { DEMO_LA, PaDemoModule } from '../../../../libs/pastanaga-angular/projects/demo/src';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SistemaPagesModule } from './sistema-pages/sistema-pages.module';

const GENERIC_TRANSLATIONS = {
  generic: {
    back: 'Back',
    cancel: 'Cancel',
    edit: 'Edit',
  },
};

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AngularSvgIconModule.forRoot(),
    PaDemoModule,
    PaButtonModule,
    PaSideNavModule,
    PaTranslateModule.addTranslations([{ en_US: I18N_EN }, { latin: DEMO_LA }, { en_US: GENERIC_TRANSLATIONS }]),
    SistemaPagesModule,
  ],
  providers: [{ provide: PA_LANG, useValue: 'en_US' }],
  bootstrap: [AppComponent],
})
export class AppModule {}
