import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs';
import { SDKService } from '@flaps/core';

@Component({
  selector: 'app-billing',
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingComponent {
  isSubscribed = this.sdk.currentAccount.pipe(
    map((account) => account.type !== 'stash-basic' && account.type !== 'stash-trial'),
  );
  isCheckoutActive = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    map(() => this.router.url.includes('checkout')),
  );

  constructor(private router: Router, private sdk: SDKService) {}
}
