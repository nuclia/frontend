import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { CdkTableModule } from '@angular/cdk/table';
import { TourMatMenuModule } from 'ngx-ui-tour-md-menu';

import { TokenDialogModule } from '../components/token-dialog/token-dialog.module';
import { ButtonActionModule } from '../components/button-action/button-action.module';
import { StashNavbarModule } from '../components/stash-navbar/stash-navbar.module';
import { ChartsModule } from '../components/charts/charts.module';
import { HelpBoxModule } from '../components/help-box/help-box.module';
import { PipesModule } from '../utils/pipes/pipes.module';

import { UserAvatarModule } from '@flaps/components';
import { STFSectionNavbarModule, STFCheckboxModule, STFSidebarModule, ProgressBarModule } from '@flaps/common';
import {
  STFButtonsModule,
  STFInputModule,
  STFTextFieldModule,
  STFFormDirectivesModule,
  STFTooltipModule,
  STFExpanderModule,
} from '@flaps/pastanaga';

import { KnowledgeBoxComponent } from './knowledge-box/knowledge-box.component';
import { KnowledgeBoxHomeComponent } from './knowledge-box-home/knowledge-box-home.component';
import { KnowledgeBoxManageComponent } from './knowledge-box-manage/knowledge-box-manage.component';
import { KnowledgeBoxProfileComponent } from './knowledge-box-profile/knowledge-box-profile.component';
import { KnowledgeBoxUsersComponent } from './knowledge-box-users/knowledge-box-users.component';
import { KnowledgeBoxKeysComponent } from './knowledge-box-keys/knowledge-box-keys.component';
import { ServiceAccessComponent } from './service-access/service-access.component';
import { UploadBarComponent } from './upload-bar/upload-bar.component';

const Components = [
  KnowledgeBoxComponent,
  KnowledgeBoxHomeComponent,
  KnowledgeBoxManageComponent,
  KnowledgeBoxProfileComponent,
  KnowledgeBoxUsersComponent,
  KnowledgeBoxKeysComponent,
  ServiceAccessComponent,
  UploadBarComponent,
];

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,
    FlexLayoutModule,
    TranslateModule.forChild(),
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    MatDialogModule,
    CdkTableModule,
    TourMatMenuModule,
    STFSidebarModule,
    ProgressBarModule,
    STFSectionNavbarModule,
    STFCheckboxModule,
    UserAvatarModule,
    STFButtonsModule,
    STFInputModule,
    STFTextFieldModule,
    STFFormDirectivesModule,
    STFTooltipModule,
    STFExpanderModule,
    ButtonActionModule,
    TokenDialogModule,
    StashNavbarModule,
    ChartsModule,
    HelpBoxModule,
    PipesModule,
  ],
  declarations: [...Components],
  exports: [],
})
export class KnowledgeBoxModule {}
