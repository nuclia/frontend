import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { A11yModule } from '@angular/cdk/a11y';

import {
  ErrorResourcesTableComponent,
  PendingResourcesTableComponent,
  ProcessedResourcesTableComponent,
  ResourcesTableComponent,
  ResourceListComponent,
  ResourcesTableDirective,
} from './resource-list';
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
  SisIconsModule,
  SisLabelModule,
  SisProgressModule,
  SisSearchInputComponent,
  SisStatusComponent,
  StickyFooterComponent,
} from '@nuclia/sistema';
import { FileUploadModule, STFPipesModule, LabelModule } from '@flaps/core';
import { UploadButtonComponent } from './upload-button';
import { PaginationModule } from '../pagination';
import { PipesModule } from '../pipes';
import { EditResourceModule } from './edit-resource/edit-resource.module';
import {
  PaButtonModule,
  PaChipsModule,
  PaDatePickerModule,
  PaDateTimeModule,
  PaDropdownModule,
  PaIconModule,
  PaPopupModule,
  PaScrollModule,
  PaTableModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { TablePaginationComponent, TitleCellComponent } from './resource-list';

const ROUTES: Routes = [
  {
    path: '',
    component: ResourcesComponent,
    children: [
      {
        path: '',
        component: ResourceListComponent,
        children: [
          {
            path: '',
            redirectTo: 'all',
            pathMatch: 'full',
          },
          {
            path: 'all',
            component: ResourcesTableComponent,
          },
          {
            path: 'processed',
            component: ProcessedResourcesTableComponent,
          },
          {
            path: 'pending',
            component: PendingResourcesTableComponent,
          },
          {
            path: 'error',
            component: ErrorResourcesTableComponent,
          },
        ],
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

    // Pastanaga
    PaButtonModule,
    PaChipsModule,
    PaDatePickerModule,
    PaDateTimeModule,
    PaDropdownModule,
    PaIconModule,
    PaPopupModule,
    PaScrollModule,
    PaTableModule,
    PaTextFieldModule,
    PaTogglesModule,
    PaTooltipModule,

    // FIXME: move what we need from old pastanaga to sistema
    STFPipesModule,

    // Sistema
    SisIconsModule,
    SisLabelModule,
    SisProgressModule,
    SisStatusComponent,
    BackButtonComponent,
    DropdownButtonComponent,
    SisSearchInputComponent,

    // Nuclia
    PaginationModule,
    PipesModule,
    LabelModule,
    FileUploadModule,

    EditResourceModule,
    TitleCellComponent,
    TablePaginationComponent,
    StickyFooterComponent,
  ],
  declarations: [
    ResourcesComponent,
    ResourceListComponent,
    ProcessedResourcesTableComponent,
    ResourcesTableComponent,
    UploadButtonComponent,
    PendingResourcesTableComponent,
    ResourcesTableDirective,
    ErrorResourcesTableComponent,
  ],
  exports: [],
})
export class ResourcesModule {}
