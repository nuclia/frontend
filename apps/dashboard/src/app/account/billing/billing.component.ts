import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs';

@Component({
  selector: 'app-billing',
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingComponent {
  isCheckoutActive = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    map(() => this.router.url.includes('checkout')),
  );

  constructor(private router: Router) {}
}
