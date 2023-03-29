import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BillingService, FEATURES, PARAMETERS } from '../billing.service';
import { CalculatorComponent } from '../calculator/calculator.component';
import { map, shareReplay } from 'rxjs';
import { SisModalService } from '@nuclia/sistema';
import { STFTrackingService } from '@flaps/core';

@Component({
  selector: 'app-subscriptions',
  templateUrl: './subscriptions.component.html',
  styleUrls: ['./subscriptions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionsComponent {
  isCalculatorEnabled = this.tracking.isFeatureEnabled('calculator').pipe(shareReplay());
  isBasic = this.billing.type.pipe(map((type) => type === 'stash-basic'));
  isTeam = this.billing.type.pipe(map((type) => type === 'stash-team'));
  features = FEATURES;
  parameters = PARAMETERS;

  constructor(
    private billing: BillingService,
    private modalService: SisModalService,
    private tracking: STFTrackingService,
  ) {}

  openCalculator() {
    this.modalService.openModal(CalculatorComponent);
  }
}
