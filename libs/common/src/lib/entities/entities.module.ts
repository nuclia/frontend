import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { EntitiesComponent } from './entities.component';
import { EntityListComponent } from './entity-list/entity-list.component';
import { AddNerDialogComponent } from './add-ner-dialog';
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
import { NerFamilyDialogComponent } from './ner-family-dialog/ner-family-dialog.component';
import { HintModule } from '../hint';
import { UploadModule } from '../upload';
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
    UploadModule,
    SisProgressModule,
    PaTableModule,
    PaPopupModule,
    PaFocusableModule,
    PaTogglesModule,
  ],
  declarations: [EntitiesComponent, EntityListComponent, AddNerDialogComponent, NerFamilyDialogComponent],
  exports: [],
})
export class EntitiesModule {}
