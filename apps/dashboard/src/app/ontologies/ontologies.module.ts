import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { A11yModule } from '@angular/cdk/a11y';
import { STFSectionNavbarModule } from '@flaps/common';
import { STFTextFieldModule, STFTooltipModule } from '@flaps/pastanaga';

import { OntologiesComponent } from './ontologies.component';
import { OntologyListComponent } from './ontology-list/ontology-list.component';
import { OntologyComponent } from './ontology/ontology.component';
import { ColorPickerComponent } from './ontology/color-picker/color-picker.component';
import { LabelComponent } from './ontology/label/label.component';
import {
  PaButtonModule,
  PaIconModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';

const Components = [
  OntologiesComponent,
  OntologyListComponent,
  OntologyComponent,
  ColorPickerComponent,
  LabelComponent,
];

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
    STFTextFieldModule,
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
export class OntologiesModule {}
