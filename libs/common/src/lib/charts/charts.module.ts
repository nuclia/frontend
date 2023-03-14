import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';

import { LineChartComponent } from './line-chart/line-chart.component';
import { BarChartComponent } from './bar-chart/bar-chart.component';
import { EmptyChartComponent } from './empty-chart/empty-chart.component';

@NgModule({
  imports: [CommonModule, AngularSvgIconModule, TranslateModule.forChild()],
  declarations: [LineChartComponent, BarChartComponent, EmptyChartComponent],
  exports: [LineChartComponent, BarChartComponent, EmptyChartComponent],
})
export class ChartsModule {}
