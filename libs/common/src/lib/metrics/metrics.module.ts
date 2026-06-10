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
import { CompactNumberPipe } from '../pipes/compact-number.pipe';

import { MetricsPageComponent } from './metrics-page.component';
import { MetricsFiltersComponent } from './metrics-filters';
import { ResourceActivityPageComponent } from './resource-activity-page/resource-activity-page.component';
import { SearchActivityPageComponent } from './search-activity-page/search-activity-page.component';
import { UserFeedbackPageComponent } from './user-feedback-page/user-feedback-page.component';
import { CostTokenUsagePageComponent } from './cost-token-usage-page/cost-token-usage-page.component';
import { UsageAnalyticsPageComponent } from './usage-analytics-page/usage-analytics-page.component';
import { RemiAnalyticsPageComponent } from './remi-analytics-page';
import { RemiScoreDisplayComponent } from './remi-score-display';

const ROUTES = [
  { path: 'usage-analytics', component: UsageAnalyticsPageComponent },
  { path: 'tokens-and-time-usage', component: CostTokenUsagePageComponent },
  { path: 'resource-activity', component: ResourceActivityPageComponent },
  { path: 'search-activity', component: SearchActivityPageComponent },
  { path: 'user-feedback', component: UserFeedbackPageComponent },
  { path: 'remi-analytics', component: RemiAnalyticsPageComponent },
  { path: 'detailed', loadChildren: () => import('./activity/activity.module').then((m) => m.ActivityModule) },
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
    RemiAnalyticsPageComponent,
    MetricsFiltersComponent,
    CompactNumberPipe,
    RemiScoreDisplayComponent,
  ],
  declarations: [
    MetricsPageComponent,
    ResourceActivityPageComponent,
    SearchActivityPageComponent,
    UserFeedbackPageComponent,
    CostTokenUsagePageComponent,
    UsageAnalyticsPageComponent,
  ],
  providers: [DatePipe],
})
export class MetricsModule {}
