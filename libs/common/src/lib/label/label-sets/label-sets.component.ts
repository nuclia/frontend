import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-label-sets',
  template: '<div class="page-spacing"><router-outlet></router-outlet></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelSetsComponent {}
