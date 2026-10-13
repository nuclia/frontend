import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';

import { BarChartComponent } from './bar-chart/bar-chart.component';
import { EmptyChartComponent } from './empty-chart/empty-chart.component';
import { LineChartComponent } from './line-chart/line-chart.component';

@NgModule({
  imports: [CommonModule, AngularSvgIconModule, LineChartComponent, BarChartComponent, EmptyChartComponent],
  exports: [LineChartComponent, BarChartComponent, EmptyChartComponent],
})
export class ChartsModule {}
