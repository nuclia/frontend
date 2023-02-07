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
import { LabelSetComponent } from './label-set/label-set.component';
import { ColorPickerComponent } from './label-set/color-picker/color-picker.component';
import { LabelComponent } from './label-set/label/label.component';
import {
  PaButtonModule,
  PaExpanderModule,
  PaIconModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { LabelListPipe } from './label-list.pipe';

const Components = [LabelSetsComponent, LabelSetListComponent, LabelSetComponent, ColorPickerComponent, LabelComponent];

const ROUTES: Routes = [
  {
    path: '',
    component: LabelSetsComponent,
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full',
      },
      {
        path: 'list',
        component: LabelSetListComponent,
      },
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
    PaExpanderModule,
  ],
  declarations: [...Components, LabelListPipe],
  exports: [],
})
export class LabelSetsModule {}
