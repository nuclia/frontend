import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { SelectComponent } from './select.component';
import { SelectKbComponent } from './select-kb/select-kb.component';
import { PaButtonModule, PaIconModule, PaTextFieldModule, PaTooltipModule } from '@guillotinaweb/pastanaga-angular';
import { BackButtonComponent } from '@nuclia/sistema';

const Components = [SelectComponent, SelectKbComponent];

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
  ],
  declarations: [...Components],
  exports: [],
})
export class SelectModule {}
