import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AccountUsage, InvoiceItem } from '../billing.models';

@Component({
  selector: 'app-usage-table',
  templateUrl: './usage-table.component.html',
  styleUrls: ['./usage-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsageTableComponent {
  paramsToShow = ['media', 'paragraphs', 'searches', 'qa', 'training'];

  @Input()
  set usage(value: AccountUsage | undefined) {
    if (value) {
      this._usage = value;
      this.invoiceItems = Object.entries(value.invoice_items)
        .filter(([type]) => this.paramsToShow.includes(type))
        .sort(([type1], [type2]) => this.paramsToShow.indexOf(type1) - this.paramsToShow.indexOf(type2));

      this.total = this.invoiceItems.reduce((acc, [, item]) => acc + item.over_cost, 0);
    }
  }
  get usage() {
    return this._usage;
  }
  private _usage?: AccountUsage;
  total = 0;
  invoiceItems: [string, InvoiceItem][] = [];

  constructor() {}
}
