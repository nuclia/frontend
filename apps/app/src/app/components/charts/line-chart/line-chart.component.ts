import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ViewEncapsulation,
  Input,
} from '@angular/core';
import { fromEvent, Subject } from 'rxjs';
import { auditTime, takeUntil } from 'rxjs/operators';
import * as d3 from 'd3';
import { createYAxis } from '../chart-utils';

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
  @ViewChild('container') private container: ElementRef | undefined;
  unsubscribeAll = new Subject<void>();

  private _data: [string, number][] = [];
  @Input() set data(values: [string, number][]) {
    this._data = values;
    this.draw();
  }

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

    // Append the svg object to the page
    d3.select(`.${this.id} svg`).remove();
    const svg = d3
      .select('.' + this.id)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
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
      .attr('stroke-width', 1.5)
      .attr('class', 'data-line')
      .attr('d', line);
  }

  private createXAxis(svg: d3.Selection<any, any, any, any>, width: number, height: number) {
    const x = d3
      .scalePoint()
      .domain(this._data.map((item) => item[0]))
      .range([0, width]);

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
}
