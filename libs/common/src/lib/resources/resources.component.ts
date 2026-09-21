import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  template: '<router-outlet></router-outlet>',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class ResourcesComponent {}
