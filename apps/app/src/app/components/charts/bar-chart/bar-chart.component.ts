import {
  Component,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ViewEncapsulation,
  Input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { fromEvent, Subject } from 'rxjs';
import { auditTime, takeUntil } from 'rxjs/operators';
import * as d3 from 'd3';
import { createYAxis } from '../chart-utils';

let nextUniqueId = 0;
const NUM_TICKS = 3;
const CHART_HEIGHT = 125;

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarChartComponent implements AfterViewInit, OnDestroy {
  id = `bar-chart-${nextUniqueId++}`;
  @ViewChild('container') private container: ElementRef | undefined;
  unsubscribeAll = new Subject<void>();

  private _data: [string, number][] = [];
  @Input() set data(values: [string, number][]) {
    this._data = values;
    this.draw();
  }
  @Input() threshold?: number;

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
    let maxValue = Math.max(...this._data.map((item) => item[1]), this.threshold || 0);
    if (maxValue === 0) {
      maxValue = 10;
    }

    // Set the dimensions and margins
    const availableWidth = this.container?.nativeElement.offsetWidth;
    const margin = { top: 0, right: 50, bottom: 30, left: 0 },
      width = availableWidth - margin.left - margin.right,
      height = CHART_HEIGHT - margin.top - margin.bottom;

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
    const y = createYAxis(svg, [minValue, maxValue * 1.5], NUM_TICKS, width, height, margin);
    const x = this.createXAxis(svg, width, height);
    if (this.threshold) {
      this.drawThreshold(svg, this.threshold, width, y);
    }

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
      .attr('width', x.bandwidth());
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
      .attr('transform', `translate(0, ${height})`)
      .attr('class', 'x-axis')
      .call(d3.axisBottom(x))
      .call((g) => g.selectAll('.tick text').attr('transform', 'rotate(-45 10 10)'))
      .call((g) => g.select('.domain').remove())
      .call((g) => g.selectAll('.tick line').remove());

    return x;
  }

  private removeExistingChartFromParent(): void {
    d3.select(this.container?.nativeElement).select('svg').remove();
  }

  private drawThreshold(
    svg: d3.Selection<any, any, any, any>,
    threshold: number,
    width: number,
    y: d3.ScaleLinear<number, number>,
  ) {
    const t = y(threshold);
    if (t) {
      svg
        .append('line')
        .style('stroke', 'var(--stf-primary)')
        .attr('class', 'threshold')
        .attr('x1', 0)
        .attr('y1', t)
        .attr('x2', width)
        .attr('y2', t);
    }
  }
}
