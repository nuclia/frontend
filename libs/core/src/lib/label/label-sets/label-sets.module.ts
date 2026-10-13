import { A11yModule } from '@angular/cdk/a11y';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';

import {
  PaButtonModule,
  PaIconModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { SisLabelModule } from '@nuclia/sistema';
import { LabelListPipe } from './label-list.pipe';
import { ColorPickerComponent, LabelComponent, LabelSetComponent, LabelSetFormComponent } from './label-set';
import { LabelSetListComponent } from './label-set-list/label-set-list.component';
import { LabelSetsComponent } from './label-sets.component';

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
