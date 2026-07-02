import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
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
import {
  DropdownButtonComponent,
  InfoCardComponent,
  SisProgressModule,
  SisSearchInputComponent,
} from '@nuclia/sistema';
import { CompactNumberPipe } from '../pipes/compact-number.pipe';

import { MetricsPageComponent } from './metrics-page.component';
import { MetricsPaginationComponent } from './metrics-pagination/metrics-pagination.component';
import { MetricsFiltersComponent } from './metrics-filters';
import { ResourceActivityPageComponent } from './resource-activity-page/resource-activity-page.component';
import { SearchActivityPageComponent } from './search-activity-page/search-activity-page.component';
import { UserFeedbackPageComponent } from './user-feedback-page/user-feedback-page.component';
import { CostTokenUsagePageComponent } from './cost-token-usage-page/cost-token-usage-page.component';
import { UsageAnalyticsPageComponent } from './usage-analytics-page/usage-analytics-page.component';
import { RemiAnalyticsPageComponent } from './remi-analytics-page';
import { RemiScoreDisplayComponent } from './remi-score-display';
import { RemiSidebarGroupComponent } from './remi-sidebar-group/remi-sidebar-group.component';

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
    PaButtonModule,
    PaDropdownModule,
    PaExpanderModule,
    PaIconModule,
    PaTableModule,
    PaTextFieldModule,
    PaTogglesModule,
    PaTooltipModule,
    DropdownButtonComponent,
    InfoCardComponent,
    SisProgressModule,
    SisSearchInputComponent,
    RemiAnalyticsPageComponent,
    MetricsFiltersComponent,
    MetricsPaginationComponent,
    CompactNumberPipe,
    RemiScoreDisplayComponent,
  ],
  declarations: [
    MetricsPageComponent,
    RemiSidebarGroupComponent,
    ResourceActivityPageComponent,
    SearchActivityPageComponent,
    UserFeedbackPageComponent,
    CostTokenUsagePageComponent,
    UsageAnalyticsPageComponent,
  ],
  providers: [DatePipe],
})
export class MetricsModule {}
