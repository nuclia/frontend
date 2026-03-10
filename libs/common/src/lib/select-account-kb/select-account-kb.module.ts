import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { SelectAccountComponent } from './select-account/select-account.component';
import { SelectKbComponent } from './select-kb/select-kb.component';
import { PaButtonModule, PaIconModule, PaTextFieldModule, PaTooltipModule } from '@guillotinaweb/pastanaga-angular';
import { BackButtonComponent, ButtonMiniComponent } from '@nuclia/sistema';

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,
    TranslateModule.forChild(),
    ReactiveFormsModule,
    RouterModule,
    PaButtonModule,
    PaIconModule,
    PaTooltipModule,
    PaTextFieldModule,
    BackButtonComponent,
    ButtonMiniComponent,
  ],
  declarations: [SelectAccountComponent, SelectKbComponent],
  exports: [],
})
export class SelectAccountKbModule {}
