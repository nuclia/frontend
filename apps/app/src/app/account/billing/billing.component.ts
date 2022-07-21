import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { StateService } from '@flaps/core';

@Component({
  selector: 'app-billing',
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingComponent {
  routesBasic = [
    { title: 'Plans', relativeRoute: 'plans' },
    { title: 'History', relativeRoute: 'history' },
  ];
  routesTeam = [
    { title: 'Plans', relativeRoute: 'plans' },
    { title: 'Plan settings', relativeRoute: 'settings' },
    { title: 'Payment details', relativeRoute: 'payment' },
    { title: 'History', relativeRoute: 'history' },
  ];

  type = this.stateService.account.pipe(
    filter((account) => !!account),
    map((account) => account!.type),
  );
  routes = this.type.pipe(map((type) => (type === 'stash-basic' ? this.routesBasic : this.routesTeam)));

  constructor(private stateService: StateService, private router: Router, private route: ActivatedRoute) {
    this.type.pipe(take(1)).subscribe((type) => {
      const path = type === 'stash-basic' ? 'plans' : 'settings';
      this.router.navigate([path], { relativeTo: this.route, replaceUrl: true });
    });
  }
}
