import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';

import { PipesModule } from '../utils/pipes/pipes.module';

import { UserAvatarModule } from '@flaps/components';
import { ChartsModule, HintModule, ProgressBarModule, TokenDialogModule } from '@flaps/common';
import { STFExpanderModule } from '@flaps/pastanaga';

import { KnowledgeBoxComponent } from './knowledge-box/knowledge-box.component';
import { KnowledgeBoxHomeComponent } from './knowledge-box-home/knowledge-box-home.component';
import { KnowledgeBoxProfileComponent } from './knowledge-box-profile/knowledge-box-profile.component';
import { KnowledgeBoxUsersComponent } from './knowledge-box-users/knowledge-box-users.component';
import { KnowledgeBoxKeysComponent } from './knowledge-box-keys/knowledge-box-keys.component';
import { ServiceAccessComponent } from './service-access/service-access.component';
import { UploadBarComponent } from './upload-bar/upload-bar.component';
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
import { DropdownButtonComponent } from '@nuclia/sistema';

const Components = [
  KnowledgeBoxComponent,
  KnowledgeBoxHomeComponent,
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
    TranslateModule.forChild(),
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    MatDialogModule,
    ProgressBarModule,
    UserAvatarModule,
    STFExpanderModule,
    TokenDialogModule,
    ChartsModule,
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
