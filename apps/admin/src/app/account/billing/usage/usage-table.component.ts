import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BillingService, BillingUsageType, InvoiceItem } from '@flaps/core';
import { map, Observable, shareReplay } from 'rxjs';

@Component({
  selector: 'app-usage-table',
  templateUrl: './usage-table.component.html',
  styleUrls: ['./usage-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class UsageTableComponent {
  paramsToShow = ['media', 'paragraphs_processed', 'searches', 'predict', 'generative', 'paragraphs', 'training'];

  usageData = this.billing.getAccountUsage().pipe(shareReplay(1));
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
  isDeprecatedAccount = this.usageData.pipe(
    map((items) => !items.invoice_items['nuclia-tokens'] && !items.invoice_items['ai-tokens-used']),
  );

  constructor(private billing: BillingService) {}
}
