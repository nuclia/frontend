import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import {
  PaButtonModule,
  PaIconModule,
  PaTableModule,
  PaTextFieldModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';

import { HintModule } from '../hint';
import { EntitiesComponent } from './entities.component';
import { EntityListComponent } from './entity-list/entity-list.component';

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
    HintModule,
    PaTableModule,
    EntitiesComponent,
    EntityListComponent,
],
  exports: [],
})
export class EntitiesModule {}
