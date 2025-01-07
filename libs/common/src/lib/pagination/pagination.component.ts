import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { coerceNumberProperty } from '@angular/cdk/coercion';

@Component({
  selector: 'stf-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss'],
  standalone: false,
})
export class PaginationComponent implements OnInit {
  @Input()
  set page(value: string | number) {
    this._page = coerceNumberProperty(value);
  }
  _page: number = 0;

  @Input() set total(value: string | number) {
    this._total = coerceNumberProperty(value);
  }
  _total: number = 1;

  @Output() prev = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
  @Output() change = new EventEmitter<number>();

  constructor() {}

  ngOnInit(): void {}
}
