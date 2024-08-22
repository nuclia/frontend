import {
  AfterViewInit,
  booleanAttribute,
  Component,
  Input,
  numberAttribute,
  OnDestroy,
  ViewEncapsulation,
} from '@angular/core';
import * as d3 from 'd3';
import { createYAxis, drawThreshold, TickOptions } from '../chart-utils';
import { BaseChartDirective } from '../base-chart.directive';

let nextUniqueId = 0;
const NUM_TICKS = 7;

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LineChartComponent extends BaseChartDirective implements AfterViewInit, OnDestroy {
  id = `line-chart-${nextUniqueId++}`;

  @Input() xAxisTickOptions?: TickOptions | null;
  @Input({ transform: booleanAttribute }) tooltipsEnabled = false;
  @Input({ transform: booleanAttribute }) area = false;
  @Input({ transform: numberAttribute }) threshold?: number;
  @Input({ transform: numberAttribute }) height = this.defaultHeight;
  @Input() xDomain?: string[];
  @Input() yDomain?: { min?: number; max?: number };
  @Input() yUnit?: string;

  @Input()
  set data(values: [string, number][]) {
    this._data = values;
    this.draw();
  }
  private _data: [string, number][] = [];

  showTooltip = false;
  tooltipContent?: [string, number];
  tooltipLeft = 0;
  tooltipBottom = 0;

  draw() {
    const minValue =
      typeof this.yDomain?.min === 'number' ? this.yDomain.min : Math.min(...this._data.map((item) => item[1]));
    let maxValue = this.yDomain?.max || Math.max(...this._data.map((item) => item[1]), this.threshold || 0);
    if (maxValue === 0) {
      maxValue = 10;
    }

    // Set the dimensions and margins
    const availableWidth = this.container?.nativeElement.offsetWidth;
    const margin = { top: 0, right: this.yUnit ? 64 : 48, bottom: 32, left: 16 };
    const width = availableWidth - margin.left - margin.right;
    const height = (this.height || this.defaultHeight) - margin.top - margin.bottom;

    // Tooltip event handlers
    const mousemove = (event: MouseEvent) => {
      if (!this.tooltipsEnabled) return;
      const [mouseX] = d3.pointer(event);
      let index = Math.round((mouseX - margin.left) / x.step());
      index = Math.max(Math.min(index, this._data.length - 1), 0);
      const left = x.step() * index + margin.left;
      const top = y(this._data[index][1]);
      this.tooltipLeft = left;
      this.tooltipBottom = this.container?.nativeElement.clientHeight - top + 6;
      this.tooltipContent = this._data[index];
      this.showTooltip = true;
      this.cdr.markForCheck();
    };

    const mouseleave = () => {
      if (!this.tooltipsEnabled) return;
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

    // Create axis
    const y = createYAxis(svg, [minValue, maxValue * 1.1], NUM_TICKS, width, height, margin, this.yUnit);
    const x = this.createXAxis(svg, width, height);
    if (this.threshold !== undefined) {
      drawThreshold(svg, this.threshold, width, y);
    }

    // Add the line
    const line = d3
      .line<[string, number]>()
      .x((d) => x(d[0])!)
      .y((d) => y(d[1])!);

    svg
      .append('path')
      .datum(this._data)
      .attr('fill', 'none')
      .attr('stroke-width', 2)
      .attr('class', 'data-line')
      .attr('d', line);

    // Add area
    if (this.area) {
      const area = d3
        .area<[string, number]>()
        .x((d) => x(d[0])!)
        .y0(y(minValue))
        .y1((d) => y(d[1])!);

      svg.insert('path', ':first-child').datum(this._data).attr('class', 'data-area').attr('d', area);
    }
  }

  private createXAxis(svg: d3.Selection<any, any, any, any>, width: number, height: number) {
    const scale = d3
      .scalePoint()
      .domain(this.xDomain || this._data.map((item) => item[0]))
      .range([0, width]);
    const xAxis = d3
      .axisBottom(scale)
      .tickValues(
        scale
          .domain()
          .filter((value, index) =>
            this.xAxisTickOptions?.modulo ? index % this.xAxisTickOptions.modulo === 0 : true,
          ),
      );
    svg
      .append('g')
      .attr('transform', `translate(0, ${height})`)
      .attr('class', 'x-axis')
      .call(xAxis)
      .call((g) => g.selectAll('.tick text'))
      .call((g) => g.select('.domain').remove());

    if (!this.xAxisTickOptions?.displayTick) {
      svg.call((g) => g.selectAll('.tick line').remove());
    }

    return scale;
  }
}
