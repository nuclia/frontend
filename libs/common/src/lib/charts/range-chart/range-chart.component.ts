import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
  numberAttribute,
  OnDestroy,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';
import { BaseChartDirective } from '../base-chart.directive';
import { TranslateService } from '@ngx-translate/core';
import { RangeChartData } from './range.models';

let nextUniqueId = 0;

@Component({
  selector: 'stf-range-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './range-chart.component.html',
  styleUrl: './range-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class RangeChartComponent extends BaseChartDirective implements AfterViewInit, OnDestroy {
  private translate = inject(TranslateService);

  id = `range-chart-${nextUniqueId++}`;
  override defaultHeight = 200;

  @Input({ transform: numberAttribute }) height = this.defaultHeight;
  @Input()
  set data(values: RangeChartData[]) {
    this._data = values;
    this.draw();
  }
  get data() {
    return this._data;
  }
  private _data: RangeChartData[] = [];

  protected draw(): void {
    // Set the dimensions and margins
    const availableWidth = this.container?.nativeElement.offsetWidth;
    const margin = { top: -16, left: 112, bottom: 32, right: 16 };
    const width = availableWidth - margin.left - margin.right;
    const height = (this.height || this.defaultHeight) - margin.top - margin.bottom;

    // Append the svg object to the page
    d3.select(`.${this.id} svg`).remove();
    const svg = d3
      .select('.' + this.id)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add X axis
    const x = d3.scaleLinear().domain([0, 100]).range([0, width]);
    svg
      .append('g')
      .attr('transform', `translate(0, ${height})`)
      .attr('class', 'x-axis')
      .call(d3.axisBottom(x).tickSize(4))
      .selectAll('text')
      .style('text-anchor', 'end');

    // Add X axis unit
    svg
      .append('text')
      .attr('transform', `translate(${width / 2}, ${height + margin.bottom})`)
      .attr('y', 0)
      .attr('x', 0)
      .attr('class', 'unit')
      .style('text-anchor', 'middle')
      .text(this.translate.instant('metrics.units.percent'));

    // Add Y axis
    const y = d3
      .scaleBand()
      .range([0, height])
      .domain(this.data.map((item) => item.category))
      .padding(1);
    svg.append('g').attr('class', 'y-axis').call(d3.axisLeft(y).tickSize(4));

    // Lines between min and max
    svg
      .selectAll('range')
      .data(this.data)
      .enter()
      .append('line')
      .attr('x1', (d) => x(d.min))
      .attr('x2', (d) => x(d.max))
      .attr('y1', (d) => y(d.category) || '')
      .attr('y2', (d) => y(d.category) || '')
      .attr('class', 'range-line');

    // Circles of average
    svg
      .selectAll('average')
      .data(this.data)
      .enter()
      .append('circle')
      .attr('cx', (d) => x(d.average))
      .attr('cy', (d) => y(d.category) || 0)
      .attr('r', 4)
      .attr('class', 'range-point');

    svg
      .selectAll('min')
      .data(this.data)
      .enter()
      .append('line')
      .attr('x1', (d) => x(d.min))
      .attr('x2', (d) => x(d.min))
      .attr('y1', (d) => (y(d.category) || 0) + 2)
      .attr('y2', (d) => (y(d.category) || 0) - 2)
      .attr('class', 'range-line');
    svg
      .selectAll('max')
      .data(this.data)
      .enter()
      .append('line')
      .attr('x1', (d) => x(d.max))
      .attr('x2', (d) => x(d.max))
      .attr('y1', (d) => (y(d.category) || 0) + 2)
      .attr('y2', (d) => (y(d.category) || 0) - 2)
      .attr('class', 'range-line');
  }
}
