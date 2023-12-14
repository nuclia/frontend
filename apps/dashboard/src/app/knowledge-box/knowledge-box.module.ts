import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { KnowledgeBoxComponent } from './knowledge-box/knowledge-box.component';
import { KnowledgeBoxHomeComponent } from './knowledge-box-home/knowledge-box-home.component';
import { KnowledgeBoxUsersComponent, UsersManageModule } from './knowledge-box-users';
import { KnowledgeBoxKeysComponent } from './knowledge-box-keys/knowledge-box-keys.component';
import { ServiceAccessComponent } from './service-access/service-access.component';
import { AccountStatusComponent } from '../account/account-status/account-status.component';
import { SurveyComponent } from './knowledge-box-home/survey/survey.component';
import {
  PaButtonModule,
  PaDateTimeModule,
  PaDropdownModule,
  PaIconModule,
  PaPopupModule,
  PaTableModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { DropdownButtonComponent, HomeContainerComponent, SisIconsModule } from '@nuclia/sistema';
import {
  ChartsModule,
  HintModule,
  KnowledgeBoxSettingsModule,
  PipesModule,
  TokenDialogModule,
  UploadModule,
} from '@flaps/common';
import { KbMetricsComponent } from './knowledge-box-home/kb-metrics/kb-metrics.component';
import { UsageChartsComponent } from './knowledge-box-home/kb-usage/usage-charts.component';

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,
    TranslateModule.forChild(),
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
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
    UploadModule,
    AccountStatusComponent,
    PaDateTimeModule,
    HomeContainerComponent,
    KnowledgeBoxSettingsModule,
    KbMetricsComponent,
    PaTooltipModule,
    SisIconsModule,
    PaButtonModule,
    PaDropdownModule,
    PaTableModule,
    UsageChartsComponent,
  ],
  declarations: [
    KnowledgeBoxComponent,
    KnowledgeBoxHomeComponent,
    KnowledgeBoxUsersComponent,
    KnowledgeBoxKeysComponent,
    ServiceAccessComponent,
    SurveyComponent,
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
