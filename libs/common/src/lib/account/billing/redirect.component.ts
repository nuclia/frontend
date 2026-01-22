import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BillingService } from '@flaps/core';
import { take } from 'rxjs';

@Component({
  template: '',
  standalone: false,
})
export class RedirectComponent {
  constructor(
    private router: Router,
    private billingService: BillingService,
    private route: ActivatedRoute,
  ) {
    this.billingService.isSubscribedToStripe.pipe(take(1)).subscribe((isSubscribed) => {
      this.router.navigate([isSubscribed ? './usage' : './subscriptions'], {
        replaceUrl: true,
        relativeTo: this.route,
      });
    });
  }
}
