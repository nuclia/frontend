import { ChangeDetectionStrategy, Component } from '@angular/core';
import { map } from 'rxjs';
import { BillingService } from '../billing.service';
import { shareReplay } from 'rxjs/operators';

@Component({
  selector: 'app-usage',
  templateUrl: './usage.component.html',
  styleUrls: ['./usage.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsageComponent {
  paramsToShow = ['media', 'paragraphs', 'searches', 'qa', 'training-hours'];
  usage = this.billing.getAccountUsage().pipe(shareReplay());
  invoiceItems = this.usage.pipe(
    map((usage) =>
      Object.entries(usage.invoice_items)
        .filter(([type]) => this.paramsToShow.includes(type))
        .sort(([type1], [type2]) => this.paramsToShow.indexOf(type1) - this.paramsToShow.indexOf(type2)),
    ),
  );

  constructor(private billing: BillingService) {}
}
