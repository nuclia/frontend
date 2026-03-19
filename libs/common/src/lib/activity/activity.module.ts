import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { ScrollingModule } from '@angular/cdk/scrolling';
import {
  PaButtonModule,
  PaDropdownModule,
  PaExpanderModule,
  PaIconModule,
  PaTableModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { TableVirtualScrollDirective } from '@flaps/core';
import {
  DropdownButtonComponent,
  InfoCardComponent,
  SisProgressModule,
  SisSearchInputComponent,
} from '@nuclia/sistema';

import { ActivityLogPageComponent } from './activity-log-page.component';
import { ProcessingActivityPageComponent } from './processing-activity-page/processing-activity-page.component';
import { SearchActivityPageComponent } from './search-activity-page/search-activity-page.component';
import { CostTokenPageComponent } from './cost-token-page/cost-token-page.component';
import { UsageAnalysisPageComponent } from './usage-analysis-page/usage-analysis-page.component';
import { MetricsPageComponent } from './metrics';

import { ProcessingActivityPageService } from './processing-activity-page/processing-activity-page.service';
import { SearchActivityPageService } from './search-activity-page/search-activity-page.service';
import { CostTokenPageService } from './cost-token-page/cost-token-page.service';
import { UsageAnalysisPageService } from './usage-analysis-page/usage-analysis-page.service';

const ROUTES = [
  { path: 'usage', component: UsageAnalysisPageComponent },
  { path: 'tokens', component: CostTokenPageComponent },
  { path: 'resources', component: ProcessingActivityPageComponent },
  { path: 'searches', component: SearchActivityPageComponent },
  { path: 'remi-analytics', component: MetricsPageComponent },
];

@NgModule({
  imports: [
    CommonModule,
    TranslateModule.forChild(),
    RouterModule.forChild(ROUTES),
    ScrollingModule,
    PaButtonModule,
    PaDropdownModule,
    PaExpanderModule,
    PaIconModule,
    PaTableModule,
    PaTextFieldModule,
    PaTogglesModule,
    PaTooltipModule,
    TableVirtualScrollDirective,
    DropdownButtonComponent,
    InfoCardComponent,
    SisProgressModule,
    SisSearchInputComponent,
    MetricsPageComponent,
  ],
  declarations: [
    ActivityLogPageComponent,
    ProcessingActivityPageComponent,
    SearchActivityPageComponent,
    CostTokenPageComponent,
    UsageAnalysisPageComponent,
  ],
  providers: [
    DatePipe,
    ProcessingActivityPageService,
    SearchActivityPageService,
    CostTokenPageService,
    UsageAnalysisPageService,
  ],
})
export class ActivityModule {}
