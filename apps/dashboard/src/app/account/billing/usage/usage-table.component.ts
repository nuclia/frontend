import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AccountUsage, InvoiceItem, UsageType } from '../billing.models';
import { STFTrackingService } from '@flaps/core';
import { combineLatest, map, Observable, ReplaySubject } from 'rxjs';

@Component({
  selector: 'app-usage-table',
  templateUrl: './usage-table.component.html',
  styleUrls: ['./usage-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsageTableComponent {
  paramsToShowDeprecated = ['media', 'paragraphs', 'searches', 'qa', 'training'];
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
  set usage(value: AccountUsage | undefined) {
    if (value) {
      this.usageData.next(value);
    }
  }

  private usageData = new ReplaySubject<AccountUsage>();
  showNewTiers = this.tracking.isFeatureEnabled('new-tiers');
  total = this.usageData.pipe(map((usage) => usage.over_cost));
  invoiceItems: Observable<[string, InvoiceItem][]> = combineLatest([this.usageData, this.showNewTiers]).pipe(
    map(([usage, showNewTiers]) => {
      const params = showNewTiers ? this.paramsToShow : this.paramsToShowDeprecated;
      return Object.entries(usage.invoice_items)
        .filter(([type]) => params.includes(type))
        .sort(([type1], [type2]) => params.indexOf(type1) - params.indexOf(type2));
    }),
  );

  constructor(private tracking: STFTrackingService) {}
}
