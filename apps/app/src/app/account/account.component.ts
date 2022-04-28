import { Component } from '@angular/core';

@Component({
  selector: 'app-account',
  template: '<router-outlet></router-outlet>',
  styles: [
    `
      :host > ::ng-deep app-account-kbs {
        margin: 22px;
        display: block;
      }
    `,
  ],
})
export class AccountComponent {}
