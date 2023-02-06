import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { A11yModule } from '@angular/cdk/a11y';
import { STFTooltipModule } from '@flaps/pastanaga';

import { LabelSetsComponent } from './label-sets.component';
import { LabelSetListComponent } from './label-set-list/label-set-list.component';
import { LabelSetComponent } from './label-set/label-set.component';
import { ColorPickerComponent } from './label-set/color-picker/color-picker.component';
import { LabelComponent } from './label-set/label/label.component';
import {
  PaButtonModule,
  PaIconModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { STFSectionNavbarModule } from '../components/section-navbar';

const Components = [LabelSetsComponent, LabelSetListComponent, LabelSetComponent, ColorPickerComponent, LabelComponent];

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,
    FlexLayoutModule,
    TranslateModule.forChild(),
    ReactiveFormsModule,
    RouterModule,
    DragDropModule,
    A11yModule,
    STFSectionNavbarModule,
    STFTooltipModule,
    PaTextFieldModule,
    PaTogglesModule,
    PaButtonModule,
    PaIconModule,
    PaTooltipModule,
  ],
  declarations: [...Components],
  exports: [],
})
export class LabelSetsModule {}
