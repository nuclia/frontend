import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  template: '<ng-container></ng-container>',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class EmptyComponent {}
