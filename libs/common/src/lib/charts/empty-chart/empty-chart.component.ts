import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-empty-chart',
  templateUrl: './empty-chart.component.html',
  styleUrls: ['./empty-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class EmptyChartComponent {
  @Input()
  set numLines(value: number) {
    this._numLines = new Array(value).fill(1);
  }
  _numLines: number[] = [];
}
