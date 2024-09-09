import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AddFieldComponent,
  DropzoneComponent,
  EditResourceComponent,
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
import {
  BadgeComponent,
  DropdownButtonComponent,
  JsonViewerComponent,
  LabelsExpanderComponent,
  SisProgressModule,
} from '@nuclia/sistema';
import {
  PaButtonModule,
  PaChipsModule,
  PaDatePickerModule,
  PaDropdownModule,
  PaExpanderModule,
  PaFocusableModule,
  PaIconModule,
  PaPopupModule,
  PaScrollModule,
  PaTableModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { FileUploadModule, LabelModule, STFPipesModule } from '@flaps/core';
import { RouterModule } from '@angular/router';
import { HintModule } from '../../hint/hint.module';
import { ThumbnailComponent } from './profile/thumbnail/thumbnail.component';
import { PipesModule } from '../../pipes';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    TranslateModule.forChild(),

    BadgeComponent,
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
    PaFocusableModule,

    STFPipesModule,
    PaTooltipModule,
    PaDatePickerModule,
    PaTableModule,
    JsonViewerComponent,
    PaTextFieldModule,
    PaPopupModule,
    LabelsExpanderComponent,
    PipesModule,
    PaTooltipModule,
  ],
  declarations: [
    AddFieldComponent,
    DropzoneComponent,
    EditResourceComponent,
    ParagraphAnnotationComponent,
    ParagraphClassificationComponent,
    PreviewComponent,
    ResourceClassificationComponent,
    ResourceFileComponent,
    ResourceLinkComponent,
    ResourceProfileComponent,
    ResourceTextComponent,
    SelectFirstFieldDirective,
    ThumbnailComponent,
  ],
})
export class EditResourceModule {}
