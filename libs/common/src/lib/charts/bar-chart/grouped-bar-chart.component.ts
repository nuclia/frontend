import { AfterViewInit, ChangeDetectionStrategy, Component, Input, numberAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from '../base-chart.directive';
import * as d3 from 'd3';

let nextUniqueId = 0;

export interface GroupedBarChartData {
  group: string;
  values: {
    [key: string]: number;
  };
}

@Component({
  selector: 'stf-grouped-bar-chart',
  imports: [CommonModule],
  templateUrl: './grouped-bar-chart.component.html',
  styleUrl: './grouped-bar-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupedBarChartComponent extends BaseChartDirective implements AfterViewInit {
  id = `grouped-bar-chart-${nextUniqueId++}`;

  override defaultHeight = 200;
  @Input({ transform: numberAttribute }) height = this.defaultHeight;
  @Input()
  set data(values: GroupedBarChartData[]) {
    this._data = values;
    this.draw();
  }
  get data() {
    return this._data;
  }
  private _data: GroupedBarChartData[] = [];

  protected draw(): void {
    // Set the dimensions and margins
    const availableWidth = this.container?.nativeElement.offsetWidth;
    const margin = { top: 16, left: 24, bottom: 16, right: 124 };
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

    // List of values’ keys
    const subgroups: string[] = Object.keys(this.data[0].values);

    // List of groups (will be shown on the X axis)
    const groups = this.data.reduce((groups, item) => {
      groups.push(item.group);
      return groups;
    }, [] as string[]);

    // Add X axis
    const x = d3.scaleBand().domain(groups).range([0, width]).padding(0.2);
    svg.append('g').attr('transform', `translate(0, ${height})`).call(d3.axisBottom(x).tickSize(0));

    // Add Y axis
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(this.data, (d) => d3.max(subgroups, (key) => d.values[key] || 0)) as number])
      .range([height, 0]);
    svg.append('g').call(d3.axisLeft(y));

    // another scale for subgroup position
    const xSubGroup = d3.scaleBand().domain(subgroups).range([0, x.bandwidth()]).padding(0.05);

    const color = d3.scaleOrdinal().domain(subgroups).range(['#FF75AC', '#674DFF', '#FFEC80']);

    // Show the bars
    svg
      .append('g')
      .selectAll('g')
      .data(this.data)
      .enter()
      .append('g')
      .attr('transform', (d) => `translate(${x(d.group)}, 0)`)
      .selectAll('rect')
      .data((d) => subgroups.map((key) => ({ key, value: d.values[key] })))
      .join('rect')
      .attr('x', (d) => xSubGroup(d.key) || 0)
      .attr('y', (d) => y(d.value))
      .attr('width', xSubGroup.bandwidth())
      .attr('height', (d) => height - y(d.value))
      .attr('fill', (d) => color(d.key) as string);

    // Show the legend
    const legend = svg
      .append('g')
      .attr('class', 'legend')
      .attr('text-anchor', 'end')
      .selectAll('g')
      .data(subgroups.slice())
      .enter()
      .append('g')
      .attr('transform', (d, i) => `translate(0, ${i * 20})`);
    legend
      .append('rect')
      .attr('x', width + margin.right - 16)
      .attr('width', 16)
      .attr('height', 16)
      .data(() => subgroups.map((key) => ({ key })))
      .attr('fill', (d) => color(d.key) as string);
    legend
      .append('text')
      .attr('x', width + margin.right - 24)
      .attr('y', 8)
      .attr('dy', '.32em')
      .text((d) => d);
  }
}
