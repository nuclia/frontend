import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { A11yModule } from '@angular/cdk/a11y';
import { CdkTableModule } from '@angular/cdk/table';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule } from '@angular/material/paginator';

import { ResourceListComponent } from './resource-list.component';
import { TableHeaderComponent } from './table-header/table-header.component';
import { EditResourceComponent } from './edit/edit-resource.component';
import { ResourcesComponent } from './resources.component';
import { ResourceProfileComponent } from './edit/profile/profile.component';
import { ResourceTextComponent } from './edit/profile/text/text.component';
import { ResourceLinkComponent } from './edit/profile/link/link.component';
import { ResourceFileComponent } from './edit/profile/file/file.component';
import {
  PaButtonModule,
  PaChipsModule,
  PaDropdownModule,
  PaExpanderModule,
  PaIconModule,
  PaPopupModule,
  PaScrollModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import {
  BackButtonComponent,
  DropdownButtonComponent,
  SisLabelModule,
  SisProgressModule,
  SisStatusComponent,
} from '@nuclia/sistema';
import { FileUploadModule, STFPipesModule } from '@flaps/core';
import { DatasetImportComponent } from './sample-dataset/dataset-import.component';
import { LoadingModalComponent } from './sample-dataset/loading-modal/loading-modal.component';
import { UploadButtonComponent } from './upload-button/upload-button.component';
import { ResourceClassificationComponent } from './edit/classification/resource-classification.component';
import { AddFieldComponent } from './edit/add-field/add-field.component';
import { DropzoneComponent } from './dropzone/dropzone.component';
import { ParagraphClassificationComponent } from './edit/classification/paragraph-classification/paragraph-classification.component';
import { DatasetSelectorComponent } from './sample-dataset/dataset-selector/dataset-selector.component';
import { ParagraphAnnotationComponent } from './edit/annotation/paragraph-annotation/paragraph-annotation.component';
import { PreviewComponent } from './edit/preview/preview.component';
import { SelectFirstFieldDirective } from './edit/select-first-field/select-first-field.directive';
import { LabelSelectionComponent } from './edit/classification/paragraph-classification/label-selection.component';
import { STFIconsModule } from '@flaps/pastanaga';
import { PaginationModule } from '../pagination';
import { PipesModule } from '../pipes';
import { LabelModule } from '../label';
import { HintModule } from '../hint';

const Components = [
  ResourceListComponent,
  TableHeaderComponent,
  ResourcesComponent,
  EditResourceComponent,
  ResourceProfileComponent,
  ResourceTextComponent,
  ResourceLinkComponent,
  ResourceFileComponent,
  DatasetImportComponent,
  DatasetSelectorComponent,
  LoadingModalComponent,
  UploadButtonComponent,
  ResourceClassificationComponent,
  AddFieldComponent,
  DropzoneComponent,
  ParagraphClassificationComponent,
  ParagraphAnnotationComponent,
  LabelSelectionComponent,
];

const ROUTES: Routes = [
  {
    path: '',
    component: ResourcesComponent,
    children: [
      {
        path: '',
        component: ResourceListComponent,
      },
      {
        path: 'dataset',
        component: DatasetImportComponent,
      },
      {
        path: ':id/edit',
        component: EditResourceComponent,
        children: [
          {
            path: '',
            redirectTo: 'resource',
            pathMatch: 'full',
          },
          {
            path: 'resource',
            component: ResourceProfileComponent,
          },
          {
            path: 'classification',
            component: ResourceClassificationComponent,
          },
          {
            path: 'classification/:fieldType',
            component: ResourceClassificationComponent,
          },
          {
            path: 'classification/:fieldType/:fieldId',
            component: ParagraphClassificationComponent,
          },
          {
            path: 'annotation',
            component: ParagraphAnnotationComponent,
          },
          {
            path: 'annotation/:fieldType/:fieldId',
            component: ParagraphAnnotationComponent,
          },
          {
            path: 'add-field',
            component: AddFieldComponent,
          },
          {
            path: 'text/:fieldId',
            component: ResourceTextComponent,
          },
          {
            path: 'link/:fieldId',
            component: ResourceLinkComponent,
          },
          {
            path: 'file/:fieldId',
            component: ResourceFileComponent,
          },
          {
            path: 'preview',
            component: PreviewComponent,
          },
          {
            path: 'preview/:fieldType/:fieldId',
            component: PreviewComponent,
          },
        ],
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
    CdkTableModule,
    A11yModule,
    MatDialogModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    PaginationModule,
    PipesModule,
    STFIconsModule,
    LabelModule,
    HintModule,
    PaTextFieldModule,
    PaButtonModule,
    PaTogglesModule,
    FormsModule,
    BackButtonComponent,
    PaTooltipModule,
    PaDropdownModule,
    DropdownButtonComponent,
    FileUploadModule,
    SisProgressModule,
    PaIconModule,
    SisStatusComponent,
    SisLabelModule,
    PaPopupModule,
    PaChipsModule,
    PaExpanderModule,
    STFPipesModule,
    PaScrollModule,
  ],
  declarations: [...Components, PreviewComponent, SelectFirstFieldDirective],
  exports: [],
})
export class ResourcesModule {}
