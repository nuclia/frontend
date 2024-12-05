import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalRef, OptionModel, PaDropdownModule, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { DropdownButtonComponent } from '@nuclia/sistema';
import { Observable } from 'rxjs';
import { ChartData } from '../../../account/metrics.service';
import { UsageChartsComponent } from './usage-charts.component';

export interface UsageModalConfig {
  processingChart: Observable<ChartData>;
  searchChart: Observable<ChartData>;
  tokenChart: Observable<ChartData>;
  currentChart: OptionModel;
  chartDropdownOptions: OptionModel[];
}

@Component({
  selector: 'app-usage-modal',
  standalone: true,
  imports: [
    CommonModule,
    PaModalModule,
    PaDropdownModule,
    TranslateModule,
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
