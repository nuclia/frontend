import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { A11yModule } from '@angular/cdk/a11y';
import { CdkTableModule } from '@angular/cdk/table';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule } from '@angular/material/paginator';

import { ResourceListComponent } from './resource-list';
import {
  AddFieldComponent,
  EditResourceComponent,
  ParagraphAnnotationComponent,
  ParagraphClassificationComponent,
  PreviewComponent,
  ResourceClassificationComponent,
  ResourceFileComponent,
  ResourceLinkComponent,
  ResourceProfileComponent,
  ResourceTextComponent,
} from './edit-resource';
import { ResourcesComponent } from './resources.component';
import {
  BackButtonComponent,
  DropdownButtonComponent,
  SisLabelModule,
  SisProgressModule,
  SisStatusComponent,
} from '@nuclia/sistema';
import { FileUploadModule, STFPipesModule } from '@flaps/core';
import { UploadButtonComponent } from './upload-button';
import { STFIconsModule } from '@flaps/pastanaga';
import { PaginationModule } from '../pagination';
import { PipesModule } from '../pipes';
import { LabelModule } from '../label';
import { DatasetImportComponent, DatasetSelectorComponent, LoadingModalComponent } from './sample-dataset';
import { EditResourceModule } from './edit-resource/edit-resource.module';
import {
  PaButtonModule,
  PaDropdownModule,
  PaIconModule,
  PaPopupModule,
  PaTableModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { ProcessedResourceTableComponent } from './resource-list/processed-resource-table/processed-resource-table.component';
import { PendingResourcesTableComponent } from './resource-list/pending-resources-table/pending-resources-table.component';
import { ResourcesTableDirective } from './resource-list/resources-table.directive';
import { ErrorResourcesTableComponent } from './resource-list/error-resources-table/error-resources-table.component';

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
    A11yModule,
    AngularSvgIconModule,
    ReactiveFormsModule,
    RouterModule.forChild(ROUTES),
    TranslateModule.forChild(),

    // Material
    CdkTableModule,
    MatDialogModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,

    // Pastanaga
    PaButtonModule,
    PaDropdownModule,
    PaIconModule,
    PaPopupModule,
    PaTableModule,
    PaTextFieldModule,
    PaTogglesModule,
    PaTooltipModule,

    // FIXME: move what we need from old pastanaga to sistema
    STFIconsModule,
    STFPipesModule,

    // Sistema
    SisLabelModule,
    SisProgressModule,
    SisStatusComponent,
    BackButtonComponent,
    DropdownButtonComponent,

    // Nuclia
    PaginationModule,
    PipesModule,
    LabelModule,
    FileUploadModule,

    EditResourceModule,
  ],
  declarations: [
    DatasetImportComponent,
    DatasetSelectorComponent,
    LoadingModalComponent,
    ResourcesComponent,
    ResourceListComponent,
    ProcessedResourceTableComponent,
    UploadButtonComponent,
    PendingResourcesTableComponent,
    ResourcesTableDirective,
    ErrorResourcesTableComponent,
  ],
  exports: [],
})
export class ResourcesModule {}
