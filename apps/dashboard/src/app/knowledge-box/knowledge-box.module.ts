import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { TourMatMenuModule } from 'ngx-ui-tour-md-menu';

import { TokenDialogModule } from '../components/token-dialog/token-dialog.module';
import { ChartsModule } from '../components/charts/charts.module';
import { HelpBoxModule } from '../components/help-box/help-box.module';
import { PipesModule } from '../utils/pipes/pipes.module';

import { UserAvatarModule } from '@flaps/components';
import { ProgressBarModule, STFSectionNavbarModule } from '@flaps/common';
import { STFExpanderModule, STFFormDirectivesModule, STFTooltipModule } from '@flaps/pastanaga';

import { KnowledgeBoxComponent } from './knowledge-box/knowledge-box.component';
import { KnowledgeBoxHomeComponent } from './knowledge-box-home/knowledge-box-home.component';
import { KnowledgeBoxManageComponent } from './knowledge-box-manage/knowledge-box-manage.component';
import { KnowledgeBoxProfileComponent } from './knowledge-box-profile/knowledge-box-profile.component';
import { KnowledgeBoxUsersComponent } from './knowledge-box-users/knowledge-box-users.component';
import { KnowledgeBoxKeysComponent } from './knowledge-box-keys/knowledge-box-keys.component';
import { ServiceAccessComponent } from './service-access/service-access.component';
import { UploadBarComponent } from './upload-bar/upload-bar.component';
import { HintModule } from '../components/hint/hint.module';
import { UsersManageModule } from './knowledge-box-users/users-manage/users-manage.module';
import {
  PaButtonModule,
  PaDropdownModule,
  PaIconModule,
  PaPopupModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { KnowledgeBoxProcessesComponent } from './knowledge-box-process/knowledge-box-processes.component';
import { DropdownButtonComponent } from '@nuclia/sistema';

const Components = [
  KnowledgeBoxComponent,
  KnowledgeBoxHomeComponent,
  KnowledgeBoxManageComponent,
  KnowledgeBoxProcessesComponent,
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
    TourMatMenuModule,
    ProgressBarModule,
    STFSectionNavbarModule,
    UserAvatarModule,
    STFFormDirectivesModule,
    STFTooltipModule,
    STFExpanderModule,
    TokenDialogModule,
    ChartsModule,
    HelpBoxModule,
    PipesModule,
    HintModule,
    UsersManageModule,
    PaButtonModule,
    PaTextFieldModule,
    PaDropdownModule,
    PaTooltipModule,
    PaTogglesModule,
    PaPopupModule,
    PaIconModule,
    DropdownButtonComponent,
  ],
  declarations: [...Components],
  exports: [],
})
export class KnowledgeBoxModule {}
