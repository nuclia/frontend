import { booleanAttribute, ChangeDetectionStrategy, Component, Input, numberAttribute } from '@angular/core';

import { ChartData, ChartsModule } from '@flaps/common';
import { OptionModel } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-kb-usage-charts',
  imports: [ChartsModule, TranslatePipe],
  templateUrl: './usage-charts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsageChartsComponent {
  @Input() tokenChart?: ChartData | null;
  @Input() processingChart?: ChartData | null;
  @Input() searchChart?: ChartData | null;
  @Input() askChart?: ChartData | null;
  @Input() currentChart?: OptionModel | null;
  @Input({ transform: numberAttribute }) chartHeight?: number;
  @Input({ transform: booleanAttribute }) smallContainer = false;

  get xAxisTickOptions() {
    return this.smallContainer ? { modulo: 6 } : null;
  }
}
