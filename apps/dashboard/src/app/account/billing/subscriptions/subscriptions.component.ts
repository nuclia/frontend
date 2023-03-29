import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BillingService, FEATURES, PARAMETERS } from '../billing.service';
import { CalculatorComponent } from '../calculator/calculator.component';
import { map } from 'rxjs';
import { SisModalService } from '@nuclia/sistema';

@Component({
  selector: 'app-subscriptions',
  templateUrl: './subscriptions.component.html',
  styleUrls: ['./subscriptions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionsComponent {
  isBasic = this.billing.type.pipe(map((type) => type === 'stash-basic'));
  isTeam = this.billing.type.pipe(map((type) => type === 'stash-team'));
  features = FEATURES;
  parameters = PARAMETERS;

  constructor(private billing: BillingService, private modalService: SisModalService) {}

  openCalculator() {
    // TODO
    //this.modalService.openModal(CalculatorComponent);
  }
}
