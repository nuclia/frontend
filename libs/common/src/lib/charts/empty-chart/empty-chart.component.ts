import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-empty-chart',
  templateUrl: './empty-chart.component.html',
  styleUrls: ['./empty-chart.component.scss'],
  standalone: false,
})
export class EmptyChartComponent implements OnInit {
  @Input()
  set numLines(value: number) {
    this._numLines = Array(value).fill(1);
  }
  _numLines: number[] = [];

  constructor() {}

  ngOnInit(): void {}
}
