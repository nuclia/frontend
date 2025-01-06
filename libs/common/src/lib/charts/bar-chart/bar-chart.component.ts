import { AfterViewInit, ChangeDetectionStrategy, Component, Input, OnDestroy, ViewEncapsulation } from '@angular/core';
import * as d3 from 'd3';
import { createYAxis, drawThreshold } from '../chart-utils';
import { getDate } from 'date-fns';
import { BaseChartDirective } from '../base-chart.directive';

let nextUniqueId = 0;
const NUM_TICKS = 3;

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class BarChartComponent extends BaseChartDirective implements AfterViewInit, OnDestroy {
  id = `bar-chart-${nextUniqueId++}`;

  private _data: [string, number][] = [];
  @Input() set data(values: [string, number][]) {
    this._data = values;
    this.draw();
  }
  @Input() threshold?: number;
  @Input() axisYMultiplier: number = 1.5;
  @Input() height: number = 170;
  @Input() locale: string = 'en-US';
  @Input() tooltipsEnabled = false;

  showTooltip = false;
  tooltipContent?: number;
  tooltipLeft = 0;
  tooltipBottom = 0;

  draw() {
    const minValue = Math.min(...this._data.map((item) => item[1]));
    let maxValue = Math.max(...this._data.map((item) => item[1]), this.threshold || 0);
    if (maxValue === 0) {
      maxValue = 10;
    }

    // Set the dimensions and margins
    const availableWidth = this.container?.nativeElement.offsetWidth;
    const margin = { top: 0, right: 50, bottom: 30, left: 0 };
    const width = availableWidth - margin.left - margin.right;
    const height = this.height - margin.top - margin.bottom;

    // Append the svg object to the page
    d3.select(`#${this.id} svg`).remove();
    const svg = d3
      .select(`#${this.id}`)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create axis
    const y = createYAxis(svg, [minValue, maxValue * this.axisYMultiplier], NUM_TICKS, width, height, margin);
    const x = this.createXAxis(svg, width, height);
    if (this.threshold) {
      drawThreshold(svg, this.threshold, width, y);
    }

    // Tooltip event handlers
    const mouseover = (event: MouseEvent, data: [string, number]) => {
      if (!this.tooltipsEnabled) return;
      const { bottom, left, height, width } = (event.target as Element).getBoundingClientRect();
      this.tooltipBottom = this.container!.nativeElement.getBoundingClientRect().bottom - bottom + height + 8;
      this.tooltipLeft = left - this.container!.nativeElement.getBoundingClientRect().left + width / 2;
      this.showTooltip = true;
      this.tooltipContent = data[1];
      this.cdr.markForCheck();
    };
    const mouseleave = () => {
      if (!this.tooltipsEnabled) return;
      this.showTooltip = false;
      this.cdr.markForCheck();
    };

    // Add the bars
    svg
      .append('g')
      .selectAll('rect')
      .data(this._data)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', (d) => x(d[0])!)
      .attr('y', (d) => y(d[1])!)
      .attr('height', (d) => y(0)! - y(d[1])!)
      .attr('width', x.bandwidth())
      .on('mouseover', mouseover)
      .on('mouseleave', mouseleave);
  }

  private createXAxis(svg: d3.Selection<any, any, any, any>, width: number, height: number) {
    const x = d3
      .scaleBand()
      .domain(this._data.map((item) => item[0]))
      .range([0, width])
      .paddingInner(0.15)
      .paddingOuter(0.1875)
      .align(0.33);

    svg
      .append('g')
      .attr('transform', `translate(0, ${height - 4})`)
      .attr('class', 'x-axis')
      .call(d3.axisBottom(x))
      .call((g) =>
        g
          .selectAll('.tick text')
          .filter((value) => {
            if (typeof value !== 'string') {
              return false;
            }
            // display future dates of the month in light gray
            return parseInt(value, 10) > getDate(Date.now());
          })
          .style('color', '#c4c4c4'),
      )
      .call((g) => g.select('.domain').remove())
      .call((g) => g.selectAll('.tick line').remove());

    return x;
  }
}
