import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { map, take } from 'rxjs';
import { BillingService } from './billing.service';

@Component({
  selector: 'app-billing',
  templateUrl: './billing.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingComponent {
  routesBasic = [
    { title: 'billing.plans', relativeRoute: 'plans' },
    { title: 'History', relativeRoute: 'history' },
  ];
  routesTeam = [
    { title: 'billing.plans', relativeRoute: 'plans' },
    { title: 'billing.plan_settings', relativeRoute: 'settings' },
    { title: 'Payment details', relativeRoute: 'payment' },
    { title: 'History', relativeRoute: 'history' },
  ];

  routes = this.billing.type.pipe(map((type) => (type === 'stash-basic' ? this.routesBasic : this.routesTeam)));

  constructor(private router: Router, private route: ActivatedRoute, private billing: BillingService) {
    this.billing.type.pipe(take(1)).subscribe((type) => {
      const path = type === 'stash-basic' ? 'plans' : 'settings';
      this.router.navigate([path], { relativeTo: this.route, replaceUrl: true });
    });
  }
}
