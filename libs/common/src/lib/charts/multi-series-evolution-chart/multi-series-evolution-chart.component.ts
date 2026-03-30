import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  numberAttribute,
  OnDestroy,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { BaseChartDirective } from '../base-chart.directive';
import { DatedRangeChartData } from '../range-chart/range.models';
import * as d3 from 'd3';
import { TranslateService } from '@ngx-translate/core';

export interface EvolutionSeriesData {
  /** Machine key — maps to a metric like 'answer_relevance' */
  key: string;
  /** Human-readable label (already translated) */
  label: string;
  /** CSS color for this series */
  color: string;
  /** Data points */
  data: DatedRangeChartData[];
  /** Whether series is visible (toggled on) */
  visible: boolean;
}

let nextUniqueId = 0;

@Component({
  selector: 'stf-multi-series-evolution-chart',
  imports: [CommonModule, PaTogglesModule],
  templateUrl: './multi-series-evolution-chart.component.html',
  styleUrl: './multi-series-evolution-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MultiSeriesEvolutionChartComponent extends BaseChartDirective implements AfterViewInit, OnDestroy {
  private translate = inject(TranslateService);

  id = `multi-series-evolution-chart-${nextUniqueId++}`;

  showTooltip = false;
  tooltipLeft = 0;
  tooltipBottom = 0;
  tooltipTimestamp = '';
  tooltipSeries: { label: string; color: string; average: number; min: number; max: number }[] = [];

  _series: EvolutionSeriesData[] = [];

  readonly height = input(400, { transform: numberAttribute });

  readonly series = input<EvolutionSeriesData[]>([]);

  constructor() {
    super();
    effect(() => {
      const values = this.series();
      if (values.length > 0) {
        this._series = values.map((s) => ({ ...s }));
        this.draw();
      }
    });
  }

  onToggleSeries(key: string): void {
    const item = this._series.find((s) => s.key === key);
    if (item) {
      item.visible = !item.visible;
      this.draw();
      this.cdr.markForCheck();
    }
  }

  protected draw(): void {
    const visibleSeries = this._series.filter((s) => s.visible);
    if (!visibleSeries.length || !this.container) return;

    const availableWidth = this.container.nativeElement.offsetWidth;
    if (!availableWidth) return;

    const margin = { top: 16, left: 56, bottom: 40, right: 16 };
    const width = availableWidth - margin.left - margin.right;
    const height = (this.height() || 400) - margin.top - margin.bottom;

    // Tooltip event handlers
    const mousemove = (event: MouseEvent) => {
      if (visibleSeries.length > 0 && visibleSeries[0].data.length > 0) {
        const [mouseX] = d3.pointer(event);
        const timestamps = visibleSeries[0].data.map((d) => d.timestamp);
        const index = Math.max(Math.min(Math.round((mouseX - margin.left) / x.step()), timestamps.length - 1), 0);
        const left = x.step() * index + margin.left;
        const top = y(visibleSeries[0].data[index].average);
        this.tooltipLeft = left - 4;
        this.tooltipBottom = this.container!.nativeElement.clientHeight - margin.top - top + 8;
        this.tooltipTimestamp = timestamps[index];
        this.tooltipSeries = visibleSeries.map((s) => ({
          label: s.label,
          color: s.color,
          average: s.data[index]?.average ?? 0,
          min: s.data[index]?.min ?? 0,
          max: s.data[index]?.max ?? 0,
        }));
        this.showTooltip = true;
        this.cdr.markForCheck();
      }
    };

    const mouseleave = () => {
      this.showTooltip = false;
      this.cdr.markForCheck();
    };

    // Clear existing SVG
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

    // Use timestamps from first visible series for x axis
    const timestamps = visibleSeries[0].data.map((d) => d.timestamp);
    const x = d3.scalePoint().domain(timestamps).range([0, width]);
    const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);

    // X axis
    svg
      .append('g')
      .attr('transform', `translate(0, ${height})`)
      .attr('class', 'x-axis')
      .call(d3.axisBottom(x).tickSize(4))
      .selectAll('text')
      .attr('transform', `${timestamps.length > 6 ? 'rotate(-45)' : ''}`)
      .style('text-anchor', 'end');

    // Y axis
    svg.append('g').attr('class', 'y-axis').call(d3.axisLeft(y).tickSize(4));

    // Y axis label
    svg
      .append('text')
      .attr('transform', `translate(-${margin.left / 2}, ${height / 2}) rotate(270)`)
      .attr('y', 0)
      .attr('x', 0)
      .attr('class', 'unit')
      .style('text-anchor', 'middle')
      .text(this.translate.instant('metrics.units.percent'));

    // Grid lines
    svg
      .selectAll('line.grid-line')
      .data(y.ticks(5))
      .join('line')
      .attr('class', 'grid-line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', (d) => y(d))
      .attr('y2', (d) => y(d));

    // Draw each visible series
    for (const series of visibleSeries) {
      // Area between min and max
      svg
        .append('path')
        .datum(series.data)
        .attr('fill', series.color)
        .attr('fill-opacity', 0.12)
        .attr('stroke', 'none')
        .attr(
          'd',
          d3
            .area<DatedRangeChartData>()
            .curve(d3.curveMonotoneX)
            .x((d) => x(d.timestamp)!)
            .y0((d) => y(d.min))
            .y1((d) => y(d.max)),
        );

      // Average line
      svg
        .append('path')
        .datum(series.data)
        .attr('fill', 'none')
        .attr('stroke', series.color)
        .attr('stroke-width', 2)
        .attr(
          'd',
          d3
            .line<DatedRangeChartData>()
            .curve(d3.curveMonotoneX)
            .x((d) => x(d.timestamp)!)
            .y((d) => y(d.average)),
        );
    }
  }
}
