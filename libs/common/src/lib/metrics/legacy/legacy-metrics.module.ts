import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LegacyRemiMetricsPageComponent } from './legacy-remi-metrics-page.component';

const ROUTES = [{ path: '', component: LegacyRemiMetricsPageComponent }];

@NgModule({
  imports: [LegacyRemiMetricsPageComponent, RouterModule.forChild(ROUTES)],
})
export class LegacyMetricsModule {}
