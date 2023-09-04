import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AccountUsage, InvoiceItem, UsageType } from '../billing.models';
import { STFTrackingService } from '@flaps/core';
import { map, Observable, ReplaySubject } from 'rxjs';

@Component({
  selector: 'app-usage-table',
  templateUrl: './usage-table.component.html',
  styleUrls: ['./usage-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsageTableComponent {
  paramsToShow: UsageType[] = [
    'media',
    'paragraphs_processed',
    'searches',
    'predict',
    'generative',
    'paragraphs',
    'training',
  ];

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
        .filter(([type]) => params.includes(type as UsageType))
        .sort(([type1], [type2]) => params.indexOf(type1 as UsageType) - params.indexOf(type2 as UsageType));
    }),
  );

  constructor(private tracking: STFTrackingService) {}
}
