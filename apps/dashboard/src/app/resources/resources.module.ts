import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { A11yModule } from '@angular/cdk/a11y';
import { CdkTableModule } from '@angular/cdk/table';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule } from '@angular/material/paginator';
import { STFExpanderModule, STFFormDirectivesModule, STFIconsModule, STFTooltipModule } from '@flaps/pastanaga';
import { PaginationModule } from '@flaps/common';
import { PipesModule } from '../utils/pipes/pipes.module';

import { ResourceListComponent } from './resource-list.component';
import { TableHeaderComponent } from './table-header/table-header.component';
import { EditResourceComponent } from './edit/edit-resource.component';
import { ResourcesComponent } from './resources.component';
import { ResourceProfileComponent } from './edit/profile/profile.component';
import { ResourceTextComponent } from './edit/profile/text/text.component';
import { ResourceLinkComponent } from './edit/profile/link/link.component';
import { ResourceFileComponent } from './edit/profile/file/file.component';
import { LabelModule } from '../components/label/label.module';
import { HintModule } from '../components/hint/hint.module';
import {
  PaButtonModule,
  PaChipsModule,
  PaDropdownModule,
  PaExpanderModule,
  PaIconModule,
  PaPopupModule,
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
import { STFSectionNavbarModule } from '../components/section-navbar';
import { DatasetImportComponent } from './sample-dataset/dataset-import.component';
import { LoadingModalComponent } from './sample-dataset/loading-modal/loading-modal.component';
import { UploadButtonComponent } from './upload-button/upload-button.component';
import { ResourceClassificationComponent } from './edit/classification/resource-classification.component';
import { AddFieldComponent } from './edit/add-field/add-field.component';
import { DropzoneComponent } from './dropzone/dropzone.component';
import { ParagraphClassificationComponent } from './edit/classification/paragraph-classification/paragraph-classification.component';
import { DatasetSelectorComponent } from './sample-dataset/dataset-selector/dataset-selector.component';
import { ParagraphAnnotationComponent } from './edit/annotation/paragraph-annotation/paragraph-annotation.component';

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
            redirectTo: 'profile',
            pathMatch: 'full',
          },
          {
            path: 'profile',
            component: ResourceProfileComponent,
          },
          {
            path: 'classification',
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
        ],
      },
    ],
  },
];

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,
    FlexLayoutModule,
    TranslateModule.forChild(),
    ReactiveFormsModule,
    RouterModule.forChild(ROUTES),
    CdkTableModule,
    A11yModule,
    MatDialogModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    STFExpanderModule,
    STFTooltipModule,
    STFIconsModule,
    STFFormDirectivesModule,
    PaginationModule,
    PipesModule,
    STFSectionNavbarModule,
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
  ],
  declarations: [...Components],
  exports: [],
})
export class ResourcesModule {}
