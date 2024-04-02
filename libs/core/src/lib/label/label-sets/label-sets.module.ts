import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { A11yModule } from '@angular/cdk/a11y';

import { LabelSetsComponent } from './label-sets.component';
import { LabelSetListComponent } from './label-set-list/label-set-list.component';
import { ColorPickerComponent, LabelComponent, LabelSetComponent, LabelSetFormComponent } from './label-set';
import {
  PaButtonModule,
  PaIconModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { LabelListPipe } from './label-list.pipe';
import { SisLabelModule } from '@nuclia/sistema';

const ROUTES: Routes = [
  {
    path: '',
    component: LabelSetsComponent,
    children: [
      {
        path: 'add',
        component: LabelSetComponent,
      },
      {
        path: ':labelSet',
        component: LabelSetComponent,
      },
    ],
  },
];

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,
    TranslateModule.forChild(),
    ReactiveFormsModule,
    RouterModule.forChild(ROUTES),
    DragDropModule,
    A11yModule,
    PaTextFieldModule,
    PaTogglesModule,
    PaButtonModule,
    PaIconModule,
    PaTooltipModule,
    SisLabelModule,
    LabelSetFormComponent,
  ],
  declarations: [
    ColorPickerComponent,
    LabelSetsComponent,
    LabelSetListComponent,
    LabelSetComponent,
    LabelComponent,
    LabelListPipe,
  ],
  exports: [],
})
export class LabelSetsModule {}
