import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'account-kbs',
  template: `
    <router-outlet></router-outlet>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AccountKbsComponent {}
