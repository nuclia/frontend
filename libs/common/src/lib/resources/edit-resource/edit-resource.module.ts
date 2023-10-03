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
import { DropdownButtonComponent, JsonViewerComponent, SisProgressModule } from '@nuclia/sistema';
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
import { FileUploadModule, STFPipesModule } from '@flaps/core';
import { RouterModule } from '@angular/router';
import { LabelModule } from '../../label/label.module';
import { HintModule } from '../../hint/hint.module';
import { ThumbnailComponent } from './profile/thumbnail/thumbnail.component';

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
    PaFocusableModule,

    STFPipesModule,
    PaTooltipModule,
    PaDatePickerModule,
    PaTableModule,
    JsonViewerComponent,
    PaTextFieldModule,
    PaPopupModule,
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
    ThumbnailComponent,
  ],
  exports: [LabelSelectionComponent],
})
export class EditResourceModule {}
