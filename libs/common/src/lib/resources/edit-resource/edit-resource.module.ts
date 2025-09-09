import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FileUploadModule, LabelModule, STFPipesModule } from '@flaps/core';
import {
  AccordionBodyDirective,
  AccordionComponent,
  AccordionItemComponent,
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
  PaTabsModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import {
  BadgeComponent,
  DropdownButtonComponent,
  ExpandableTextareaComponent,
  InfoCardComponent,
  JsonViewerComponent,
  LabelsExpanderComponent,
  SisProgressModule,
} from '@nuclia/sistema';
import { HintModule } from '../../hint/hint.module';
import { PipesModule } from '../../pipes';
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
import { RelationsComponent } from './annotation/relations/relations.component';
import { PreviewTableComponent } from './preview/preview-table.component';
import { ThumbnailComponent } from './profile/thumbnail/thumbnail.component';

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
    PaTableModule,
    AccordionComponent,
    AccordionItemComponent,
    AccordionBodyDirective,

    STFPipesModule,
    PaTooltipModule,
    PaDatePickerModule,
    PaTableModule,
    PaTabsModule,
    JsonViewerComponent,
    PaTextFieldModule,
    PaPopupModule,
    LabelsExpanderComponent,
    PipesModule,
    PaTooltipModule,
    RelationsComponent,
    InfoCardComponent,
    ExpandableTextareaComponent,
  ],
  declarations: [
    AddFieldComponent,
    DropzoneComponent,
    EditResourceComponent,
    ParagraphAnnotationComponent,
    ParagraphClassificationComponent,
    PreviewComponent,
    PreviewTableComponent,
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
