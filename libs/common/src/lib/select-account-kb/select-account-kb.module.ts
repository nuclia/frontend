import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';

import { PaButtonModule, PaIconModule, PaTextFieldModule, PaTooltipModule } from '@guillotinaweb/pastanaga-angular';
import { BackButtonComponent, ButtonMiniComponent } from '@nuclia/sistema';
import { SelectAccountComponent } from './select-account/select-account.component';
import { SelectKbComponent } from './select-kb/select-kb.component';

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,

    ReactiveFormsModule,
    RouterModule,
    PaButtonModule,
    PaIconModule,
    PaTooltipModule,
    PaTextFieldModule,
    BackButtonComponent,
    ButtonMiniComponent,
    SelectAccountComponent,
    SelectKbComponent,
  ],
  exports: [],
})
export class SelectAccountKbModule {}
