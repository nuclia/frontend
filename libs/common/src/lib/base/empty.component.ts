import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  template: '<ng-container></ng-container>',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
})
export class EmptyComponent {}
