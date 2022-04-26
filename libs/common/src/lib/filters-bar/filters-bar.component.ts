import { Component, Input } from '@angular/core';

export type FiltersBarColor = 'white' | 'gray';

@Component({
  selector: 'stf-filters-bar',
  templateUrl: './filters-bar.component.html',
  styleUrls: ['./filters-bar.component.scss'],
})
export class FiltersBarComponent {
  @Input() contentClass: string = '';
  @Input() color: FiltersBarColor = 'gray';

  constructor() {}
}
