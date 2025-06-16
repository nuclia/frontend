import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { FormsModule } from '@angular/forms';
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
import { LabelFieldComponent } from './label-field/label-field.component';
import { LabelListComponent } from './label-list/label-list.component';

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
    FormsModule,
  ],
  declarations: [...components, LabelDropdownComponent],
  exports: [...components, LabelDropdownComponent],
})
export class LabelModule {}
