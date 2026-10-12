import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ChartData } from '@flaps/common';
import { ModalRef, OptionModel, PaDropdownModule, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { DropdownButtonComponent } from '@nuclia/sistema';
import { Observable } from 'rxjs';
import { UsageChartsComponent } from './usage-charts.component';

export interface UsageModalConfig {
  processingChart: Observable<ChartData>;
  searchChart: Observable<ChartData>;
  askChart: Observable<ChartData>;
  tokenChart: Observable<ChartData>;
  currentChart: OptionModel;
  chartDropdownOptions: OptionModel[];
  isSubscribed: Observable<boolean>;
  currentPeriod: { start: Date; end: Date };
}

@Component({
  selector: 'app-usage-modal',
  imports: [
    CommonModule,
    PaModalModule,
    PaDropdownModule,
    TranslatePipe,
    DropdownButtonComponent,
    UsageChartsComponent,
  ],
  templateUrl: './usage-modal.component.html',
  styleUrl: './usage-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsageModalComponent {
  isChartDropdownOpen = false;
  config: UsageModalConfig;
  currentChart: OptionModel;
  chartHeight = (window.innerHeight * 75) / 100 - 96;

  constructor(public modal: ModalRef<UsageModalConfig>) {
    this.config = this.modal.config.data as UsageModalConfig;
    this.currentChart = this.config.currentChart;
  }

  selectChart(chart: OptionModel) {
    this.currentChart = chart;
  }
}
