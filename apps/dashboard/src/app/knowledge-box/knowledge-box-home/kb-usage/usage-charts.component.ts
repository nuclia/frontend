import { booleanAttribute, ChangeDetectionStrategy, Component, Input, numberAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartsModule } from '@flaps/common';
import { ChartData } from '../../../account/metrics.service';
import { OptionModel } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-kb-usage-charts',
  standalone: true,
  imports: [CommonModule, ChartsModule, TranslateModule],
  templateUrl: './usage-charts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsageChartsComponent {
  @Input() processingChart?: ChartData | null;
  @Input() searchChart?: ChartData | null;
  @Input() currentChart?: OptionModel | null;
  @Input({ transform: numberAttribute }) chartHeight?: number;
  @Input({ transform: booleanAttribute }) smallContainer = false;
}
