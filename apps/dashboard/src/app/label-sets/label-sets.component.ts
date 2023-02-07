import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-label-sets',
  template: '<router-outlet></router-outlet>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelSetsComponent {}
