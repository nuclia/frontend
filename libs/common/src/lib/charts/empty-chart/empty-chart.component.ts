import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-chart',
  templateUrl: './empty-chart.component.html',
  styleUrls: ['./empty-chart.component.scss'],
  standalone: false,
})
export class EmptyChartComponent {
  @Input()
  set numLines(value: number) {
    this._numLines = new Array(value).fill(1);
  }
  _numLines: number[] = [];
}
