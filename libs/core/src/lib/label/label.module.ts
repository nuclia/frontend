import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { LabelListComponent } from './label-list/label-list.component';
import { LabelFieldComponent } from './label-field/label-field.component';
import {
  PaButtonModule,
  PaChipsModule,
  PaDropdownModule,
  PaIconModule,
  PaPopupModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { DropdownButtonComponent } from '@nuclia/sistema';
import { LabelDropdownComponent } from './label-dropdown/label-dropdown.component';

const components = [LabelListComponent, LabelFieldComponent];

@NgModule({
  imports: [
    CommonModule,
    TranslateModule.forChild(),
    PaChipsModule,
    PaButtonModule,
    PaIconModule,
    PaTextFieldModule,
    PaDropdownModule,
    PaPopupModule,
    PaTogglesModule,
    DropdownButtonComponent,
  ],
  declarations: [...components, LabelDropdownComponent],
  exports: [...components, LabelDropdownComponent],
})
export class LabelModule {}
