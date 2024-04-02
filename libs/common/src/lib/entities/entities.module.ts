import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { EntitiesComponent } from './entities.component';
import { EntityListComponent } from './entity-list/entity-list.component';
import {
  PaButtonModule,
  PaExpanderModule,
  PaFocusableModule,
  PaIconModule,
  PaModalModule,
  PaPopupModule,
  PaTableModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { HintModule } from '../hint';
import { CsvSelectComponent } from '../upload';
import { SisProgressModule } from '@nuclia/sistema';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([{ path: '', component: EntitiesComponent }]),
    TranslateModule.forChild(),
    ReactiveFormsModule,
    PaTextFieldModule,
    PaButtonModule,
    PaIconModule,
    PaTooltipModule,
    PaModalModule,
    PaExpanderModule,
    HintModule,
    CsvSelectComponent,
    SisProgressModule,
    PaTableModule,
    PaPopupModule,
    PaFocusableModule,
    PaTogglesModule,
  ],
  declarations: [EntitiesComponent, EntityListComponent],
  exports: [],
})
export class EntitiesModule {}
