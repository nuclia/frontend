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
import { PaginationModule, STFSectionNavbarModule } from '@flaps/common';
import { PipesModule } from '../utils/pipes/pipes.module';

import { ResourceListComponent } from './resource-list.component';
import { TableHeaderComponent } from './table-header/table-header.component';
import { EditResourceComponent } from './edit/edit-resource.component';
import { ResourcesComponent } from './resources.component';
import { ResourceProfileComponent } from './edit/profile/profile.component';
import { ResourceTextComponent } from './edit/text/text.component';
import { ResourceLinkComponent } from './edit/link/link.component';
import { ResourceFileComponent } from './edit/file/file.component';
import { LabelModule } from '../components/label/label.module';
import { HintModule } from '../components/hint/hint.module';
import {
  PaButtonModule,
  PaDropdownModule,
  PaIconModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { BackButtonComponent, DropdownButtonComponent, SisProgressModule, SisStatusComponent } from '@nuclia/sistema';
import { FileUploadModule } from '@flaps/core';

const Components = [
  ResourceListComponent,
  TableHeaderComponent,
  ResourcesComponent,
  EditResourceComponent,
  ResourceProfileComponent,
  ResourceTextComponent,
  ResourceLinkComponent,
  ResourceFileComponent,
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
        path: ':id',
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
            path: 'text',
            component: ResourceTextComponent,
          },
          {
            path: 'link',
            component: ResourceLinkComponent,
          },
          {
            path: 'file',
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
  ],
  declarations: [...Components],
  exports: [],
})
export class ResourcesModule {}
