import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  template: '<router-outlet></router-outlet>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ManageZonesComponent {}
