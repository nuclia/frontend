import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AccountUsage, BillingService, BillingUsageType, InvoiceItem } from '@flaps/core';
import { map, Observable, ReplaySubject } from 'rxjs';

@Component({
  selector: 'app-usage-table',
  templateUrl: './usage-table.component.html',
  styleUrls: ['./usage-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsageTableComponent {
  paramsToShow = ['media', 'paragraphs_processed', 'searches', 'predict', 'generative', 'paragraphs', 'training'];

  @Input()
  set usage(value: AccountUsage | undefined | null) {
    if (value) {
      this.usageData.next(value);
    }
  }

  usageData = new ReplaySubject<AccountUsage>();
  total = this.usageData.pipe(map((usage) => usage.over_cost));
  invoiceItems: Observable<[string, InvoiceItem][]> = this.usageData.pipe(
    map((usage) => {
      const params = this.paramsToShow;
      return Object.entries(usage.invoice_items)
        .filter(([type]) => params.includes(type as BillingUsageType))
        .sort(
          ([type1], [type2]) => params.indexOf(type1 as BillingUsageType) - params.indexOf(type2 as BillingUsageType),
        );
    }),
  );
  isDeprecatedAccount = this.billing.isDeprecatedAccount;

  constructor(private billing: BillingService) {}
}
