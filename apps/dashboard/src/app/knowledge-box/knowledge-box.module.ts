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
  PaTabsModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { DropdownButtonComponent, HomeContainerComponent, InfoCardComponent, SisIconsModule } from '@nuclia/sistema';
import {
  ChartsModule,
  GenerativeModelPipe,
  HintModule,
  KnowledgeBoxSettingsModule,
  PipesModule,
  RangeChartComponent,
  TokenDialogModule,
  UploadModule,
} from '@flaps/common';
import { UsageChartsComponent } from './knowledge-box-home/kb-usage/usage-charts.component';
import { STFPipesModule } from '@flaps/core';

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
    PaTooltipModule,
    SisIconsModule,
    PaButtonModule,
    PaDropdownModule,
    PaTableModule,
    UsageChartsComponent,
    GenerativeModelPipe,
    InfoCardComponent,
    PaTabsModule,
    PaTableModule,
    STFPipesModule,
    RangeChartComponent,
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
