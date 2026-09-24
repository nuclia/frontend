import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';

import {
  PaButtonModule,
  PaDateTimeModule,
  PaDropdownModule,
  PaExpanderModule,
  PaIconModule,
  PaPopupModule,
  PaTableModule,
  PaTabsModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { DropdownButtonComponent, HomeContainerComponent, InfoCardComponent } from '@nuclia/sistema';
import { KbOnboardingHeaderComponent } from './knowledge-box-home/kb-onboarding/kb-onboarding-header.component';
import { KnowledgeBoxHomeComponent } from './knowledge-box-home/knowledge-box-home.component';
import { KnowledgeBoxComponent } from './knowledge-box/knowledge-box.component';

import {
  AccountStatusComponent,
  ChartsModule,
  GenerativeModelPipe,
  HintModule,
  KnowledgeBoxSettingsComponent,
  RangeChartComponent,
  TokenDialogModule,
  UploadModule,
  UsersManageModule,
} from '@flaps/common';
import { UsageChartsComponent } from './knowledge-box-home/kb-usage/usage-charts.component';

import { STFPipesModule } from '@flaps/core';
import { ContentPlaceholderComponent } from './knowledge-box-home/content-placeholder/content-placeholder.component';
import { LastResourcesComponent } from './knowledge-box-home/last-resources/last-resources.component';

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
    HintModule,
    UsersManageModule,
    PaButtonModule,
    PaExpanderModule,
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
    KnowledgeBoxSettingsComponent,
    PaTooltipModule,
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
    LastResourcesComponent,
    ContentPlaceholderComponent,
    KbOnboardingHeaderComponent,
    KnowledgeBoxComponent,
    KnowledgeBoxHomeComponent,
  ],
  exports: [KnowledgeBoxComponent, KnowledgeBoxHomeComponent],
})
export class KnowledgeBoxModule {}
