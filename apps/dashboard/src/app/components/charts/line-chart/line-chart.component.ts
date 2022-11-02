import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
  ViewEncapsulation,
  ChangeDetectorRef,
} from '@angular/core';
import { fromEvent, Subject } from 'rxjs';
import { auditTime, takeUntil } from 'rxjs/operators';
import * as d3 from 'd3';
import { createYAxis, TickOptions } from '../chart-utils';

let nextUniqueId = 0;
const NUM_TICKS = 7;
const CHART_HEIGHT = 332;

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LineChartComponent implements AfterViewInit, OnDestroy {
  id = `line-chart-${nextUniqueId++}`;
  unsubscribeAll = new Subject<void>();

  @ViewChild('container') private container: ElementRef | undefined;

  @Input() xAxisTickOptions?: TickOptions;
  @Input() tooltipsEnabled = false;

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

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    setTimeout(() => this.draw(), 0);

    // Make the chart responsive
    fromEvent(window, 'resize')
      .pipe(auditTime(200), takeUntil(this.unsubscribeAll))
      .subscribe(() => {
        this.removeExistingChartFromParent();
        this.draw();
      });
  }

  ngOnDestroy() {
    if (this.unsubscribeAll) {
      this.unsubscribeAll.next();
      this.unsubscribeAll.complete();
    }
  }

  draw() {
    const minValue = Math.min(...this._data.map((item) => item[1]));
    let maxValue = Math.max(...this._data.map((item) => item[1]));
    if (maxValue === 0) {
      maxValue = 10;
    }

    // Set the dimensions and margins
    const availableWidth = this.container?.nativeElement.offsetWidth;

    const margin = { top: 0, right: 50, bottom: 30, left: 15 },
      width = availableWidth - margin.left - margin.right,
      height = CHART_HEIGHT - margin.top - margin.bottom;

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
    const y = createYAxis(svg, [minValue, maxValue * 1.5], NUM_TICKS, width, height, margin);
    const x = this.createXAxis(svg, width, height);

    // Add the line
    const line = d3
      .line<[string, number]>()
      .x((d) => x(d[0])!)
      .y((d) => y(d[1])!);

    svg
      .append('path')
      .datum(this._data)
      .attr('fill', 'none')
      .attr('stroke-width', 1)
      .attr('class', 'data-line')
      .attr('d', line);
  }

  private createXAxis(svg: d3.Selection<any, any, any, any>, width: number, height: number) {
    const scale = d3
      .scalePoint()
      .domain(this._data.map((item) => item[0]))
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

  private removeExistingChartFromParent(): void {
    d3.select(this.container?.nativeElement).select('svg').remove();
  }
}
