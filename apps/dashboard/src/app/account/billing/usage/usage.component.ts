import { ChangeDetectionStrategy, Component } from '@angular/core';
import { shareReplay } from 'rxjs';
import { BillingService } from '@flaps/core';

@Component({
  selector: 'app-usage',
  templateUrl: './usage.component.html',
  styleUrls: ['./usage.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsageComponent {
  usage = this.billing.getAccountUsage().pipe(shareReplay());

  constructor(private billing: BillingService) {}
}
