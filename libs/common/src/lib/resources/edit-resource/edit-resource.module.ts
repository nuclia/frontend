import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AddFieldComponent,
  DropzoneComponent,
  EditResourceComponent,
  LabelSelectionComponent,
  ParagraphAnnotationComponent,
  ParagraphClassificationComponent,
  PreviewComponent,
  ResourceClassificationComponent,
  ResourceFileComponent,
  ResourceLinkComponent,
  ResourceProfileComponent,
  ResourceTextComponent,
  SelectFirstFieldDirective,
} from './';
import { DropdownButtonComponent, SisProgressModule } from '@nuclia/sistema';
import {
  PaButtonModule,
  PaChipsModule,
  PaDropdownModule,
  PaExpanderModule,
  PaIconModule,
  PaScrollModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { FileUploadModule, STFPipesModule } from '@flaps/core';
import { RouterModule } from '@angular/router';
import { LabelModule } from '../../label';
import { HintModule } from '../../hint';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    TranslateModule.forChild(),

    DropdownButtonComponent,
    LabelModule,
    FileUploadModule,
    HintModule,
    SisProgressModule,

    PaButtonModule,
    PaChipsModule,
    PaDropdownModule,
    PaExpanderModule,
    PaIconModule,
    PaScrollModule,
    PaTextFieldModule,
    PaTogglesModule,

    STFPipesModule,
  ],
  declarations: [
    AddFieldComponent,
    DropzoneComponent,
    EditResourceComponent,
    LabelSelectionComponent,
    ParagraphAnnotationComponent,
    ParagraphClassificationComponent,
    PreviewComponent,
    ResourceClassificationComponent,
    ResourceFileComponent,
    ResourceLinkComponent,
    ResourceProfileComponent,
    ResourceTextComponent,
    SelectFirstFieldDirective,
  ],
  exports: [LabelSelectionComponent],
})
export class EditResourceModule {}
