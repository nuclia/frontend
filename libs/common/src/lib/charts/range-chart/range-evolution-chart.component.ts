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
import { BaseChartDirective } from '../base-chart.directive';
import { DatedRangeChartData } from './range.models';
import * as d3 from 'd3';
import { TranslateService } from '@ngx-translate/core';

let nextUniqueId = 0;

@Component({
  selector: 'stf-range-evolution-chart',
  imports: [CommonModule],
  templateUrl: './range-evolution-chart.component.html',
  styleUrl: './range-evolution-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class RangeEvolutionChartComponent extends BaseChartDirective implements AfterViewInit, OnDestroy {
  private translate = inject(TranslateService);

  id = `range-evolution-chart-${nextUniqueId++}`;

  showTooltip = false;
  tooltipContent?: DatedRangeChartData;
  tooltipLeft = 0;
  tooltipBottom = 0;

  @Input({ transform: numberAttribute }) height = this.defaultHeight;
  @Input()
  set data(values: DatedRangeChartData[]) {
    this._data = values;
    this.draw();
  }
  get data() {
    return this._data;
  }
  private _data: DatedRangeChartData[] = [];

  protected draw(): void {
    // Set the dimensions and margins
    const availableWidth = this.container?.nativeElement.offsetWidth;
    const margin = { top: 16, left: 56, bottom: 40, right: 16 };
    const width = availableWidth - margin.left - margin.right;
    const height = (this.height || this.defaultHeight) - margin.top - margin.bottom;

    // Tooltip event handlers
    const mousemove = (event: MouseEvent) => {
      const [mouseX] = d3.pointer(event);
      let index = Math.round((mouseX - margin.left) / x.step());
      index = Math.max(Math.min(index, this._data.length - 1), 0);
      const left = x.step() * index + margin.left;
      const top = y(this._data[index].average);
      this.tooltipLeft = left - 4;
      this.tooltipBottom = this.container?.nativeElement.clientHeight - margin.top - top + 8;
      this.tooltipContent = this._data[index];
      this.showTooltip = true;
      this.cdr.markForCheck();
    };

    const mouseleave = () => {
      this.showTooltip = false;
      this.cdr.markForCheck();
    };

    // Append the svg object to the page
    d3.select(`.${this.id} svg`).remove();
    const svg = d3
      .select('.' + this.id)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .on('mouseover mousemove', mousemove)
      .on('mouseleave', mouseleave)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add x axis
    const x = d3
      .scalePoint()
      .domain(this.data.map((item) => item.timestamp))
      .range([0, width]);
    svg
      .append('g')
      .attr('transform', `translate(0, ${height})`)
      .attr('class', 'x-axis')
      .call(d3.axisBottom(x).tickSize(4))
      .selectAll('text')
      .attr('transform', `${this.data.length > 6 ? 'rotate(-45)' : ''}`)
      .style('text-anchor', 'end');

    // Add y axis
    const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);
    svg.append('g').attr('class', 'y-axis').call(d3.axisLeft(y).tickSize(4));

    // Add Y axis unit
    svg
      .append('text')
      .attr('transform', `translate(-${margin.left / 2}, ${height / 2}) rotate(270)`)
      .attr('y', 0)
      .attr('x', 0)
      .attr('class', 'unit')
      .style('text-anchor', 'middle')
      .text(this.translate.instant('metrics.units.percent'));

    // Show range interval area
    svg
      .append('path')
      .datum(this.data)
      .attr('stroke', 'none')
      .attr('class', 'range-area')
      .attr(
        'd',
        d3
          .area<DatedRangeChartData>()
          .curve(d3.curveMonotoneX)
          .x((d) => x(d.timestamp)!)
          .y0((d) => y(d.min))
          .y1((d) => y(d.max)),
      );

    // Add the line
    const line = d3
      .line<DatedRangeChartData>()
      .curve(d3.curveMonotoneX)
      .x((d) => x(d.timestamp)!)
      .y((d) => y(d.average));
    svg.append('path').datum(this.data).attr('class', 'evolution-line').attr('d', line);
  }
}
