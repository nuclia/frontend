import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
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

  constructor(private router: Router, private route: ActivatedRoute) {}

  toggleMode() {
    this.mode = this.mode === 'annual' ? 'monthly' : 'annual';
  }

  upgrade() {
    this.router.navigate(['../settings'], { relativeTo: this.route });
  }
}
