import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { STFTrackingService } from '@flaps/core';
import { shareReplay } from 'rxjs';
import { BASIC_PLAN, PLAN_PARAMETERS, TEAM_PLAN } from '../billing.service';

@Component({
  selector: 'app-plans',
  templateUrl: './plans.component.html',
  styleUrls: ['./plans.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlansComponent {
  mode: 'monthly' | 'annual' = 'annual';
  teamPlan = TEAM_PLAN;
  basicPlan = BASIC_PLAN;
  parameters = PLAN_PARAMETERS;
  isBillingEnabled = this.tracking.isFeatureEnabled('billing').pipe(shareReplay(1));

  constructor(private router: Router, private route: ActivatedRoute, private tracking: STFTrackingService) {}

  toggleMode() {
    this.mode = this.mode === 'annual' ? 'monthly' : 'annual';
  }

  upgrade() {
    this.router.navigate(['../settings'], { relativeTo: this.route });
  }
}
