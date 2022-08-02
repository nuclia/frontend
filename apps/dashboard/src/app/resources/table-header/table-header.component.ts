import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-table-header',
  templateUrl: './table-header.component.html',
  styleUrls: ['./table-header.component.scss'],
})
export class TableHeaderComponent {
  @Input() sortDirection: 'asc' | 'desc' | null = null;
  @Output() sort: EventEmitter<void> = new EventEmitter();

  constructor() {}

  onClick($event: any) {
    $event.preventDefault();
    this.sort.emit();
  }
}
