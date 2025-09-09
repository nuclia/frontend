import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-account-arag',
  template: `
    <router-outlet></router-outlet>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AccountAragComponent {}
