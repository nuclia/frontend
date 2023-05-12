import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { STFExpanderModule } from '@flaps/pastanaga';

import { KnowledgeBoxComponent } from './knowledge-box/knowledge-box.component';
import { KnowledgeBoxHomeComponent } from './knowledge-box-home/knowledge-box-home.component';
import { KnowledgeBoxUsersComponent, UsersManageModule } from './knowledge-box-users';
import { KnowledgeBoxKeysComponent } from './knowledge-box-keys/knowledge-box-keys.component';
import { ServiceAccessComponent } from './service-access/service-access.component';
import { AccountStatusComponent } from '../account/account-status/account-status.component';
import {
  PaButtonModule,
  PaDropdownModule,
  PaIconModule,
  PaPopupModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
  PaTranslateModule,
} from '@guillotinaweb/pastanaga-angular';
import { DropdownButtonComponent } from '@nuclia/sistema';
import {
  ChartsModule,
  HintModule,
  PipesModule,
  ProgressBarModule,
  TokenDialogModule,
  UploadModule,
} from '@flaps/common';

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,
    TranslateModule.forChild(),
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    ProgressBarModule,
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
    PaTranslateModule,
    UploadModule,
    AccountStatusComponent,
  ],
  declarations: [
    KnowledgeBoxComponent,
    KnowledgeBoxHomeComponent,
    KnowledgeBoxUsersComponent,
    KnowledgeBoxKeysComponent,
    ServiceAccessComponent,
  ],
  exports: [
    KnowledgeBoxComponent,
    KnowledgeBoxHomeComponent,
    KnowledgeBoxUsersComponent,
    KnowledgeBoxKeysComponent,
    ServiceAccessComponent,
  ],
})
export class KnowledgeBoxModule {}
