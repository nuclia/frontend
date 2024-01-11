import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ReactiveFormsModule } from '@angular/forms';
import {
  PaButtonModule,
  PaIconModule,
  PaModalModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { SisProgressModule } from '@nuclia/sistema';
import { KnowledgeBoxSettingsModule } from '../knowledge-box-settings';

import { KbAddComponent } from './kb-add.component';
import { LanguageFieldComponent } from '@nuclia/user';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    AngularSvgIconModule,
    TranslateModule.forChild(),
    KnowledgeBoxSettingsModule,
    PaButtonModule,
    PaIconModule,
    PaModalModule,
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
    SisProgressModule,
    LanguageFieldComponent,
  ],
  declarations: [KbAddComponent],
  exports: [KbAddComponent],
})
export class KbAddModule {}
