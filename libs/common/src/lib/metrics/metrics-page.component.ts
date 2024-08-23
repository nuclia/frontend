import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import {
  AccordionBodyDirective,
  AccordionComponent,
  AccordionItemComponent,
  PaTextFieldModule,
} from '@guillotinaweb/pastanaga-angular';
import { Observable } from 'rxjs';
import { DatedRangeChartData, RangeChartComponent, RangeChartData, RangeEvolutionChartComponent } from '../charts';
import { RemiMetricsService } from './remi-metrics.service';
import { RemiQueryResponseContextDetails, RemiQueryResponseItem } from './remi.models';
import { SisProgressModule } from '@nuclia/sistema';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    PaTextFieldModule,
    RangeChartComponent,
    RangeEvolutionChartComponent,
    AccordionComponent,
    AccordionItemComponent,
    AccordionBodyDirective,
    SisProgressModule,
  ],
  templateUrl: './metrics-page.component.html',
  styleUrl: './metrics-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricsPageComponent {
  private remiMetrics = inject(RemiMetricsService);
  private cdr = inject(ChangeDetectorRef);

  period: '24h' | '7d' | '14d' | '30d' = '7d';

  healthCheckData: Observable<RangeChartData[]> = this.remiMetrics.healthCheckData;

  groundednessEvolution: Observable<DatedRangeChartData[]> = this.remiMetrics.groundednessEvolution;
  answerEvolution: Observable<DatedRangeChartData[]> = this.remiMetrics.answerEvolution;
  contextEvolution: Observable<DatedRangeChartData[]> = this.remiMetrics.contextEvolution;
  missingKnowledgeData: Observable<RemiQueryResponseItem[]> = this.remiMetrics.missingKnowledgeData;

  missingKnowledgeDetails: { [id: string]: RemiQueryResponseContextDetails } = {};

  loadMissingKnowledgeDetails(id: string) {
    if (this.missingKnowledgeDetails[id]) {
      return;
    }
    this.remiMetrics.getMissingKnowledgeDetails(id).subscribe((details) => {
      this.missingKnowledgeDetails = { ...this.missingKnowledgeDetails, [id]: details };
      this.cdr.markForCheck();
    });
  }
}
