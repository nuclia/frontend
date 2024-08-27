import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import {
  AccordionBodyDirective,
  AccordionComponent,
  AccordionItemComponent,
  PaTextFieldModule,
} from '@guillotinaweb/pastanaga-angular';
import { Observable, Subject } from 'rxjs';
import { DatedRangeChartData, RangeChartComponent, RangeChartData, RangeEvolutionChartComponent } from '../charts';
import { RemiMetricsService, RemiPeriods } from './remi-metrics.service';
import {
  RemiQueryCriteria,
  RemiQueryResponseContextDetails,
  RemiQueryResponseItem,
} from '../../../../sdk-core/src/lib/db/kb/activity/remi.models';
import { SisProgressModule } from '@nuclia/sistema';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { format } from 'date-fns';
import { takeUntil } from 'rxjs/operators';

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
    ReactiveFormsModule,
  ],
  templateUrl: './metrics-page.component.html',
  styleUrl: './metrics-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricsPageComponent implements OnInit, OnDestroy {
  private remiMetrics = inject(RemiMetricsService);
  private cdr = inject(ChangeDetectorRef);

  private unsubscribeAll: Subject<void> = new Subject();

  @ViewChild('missingKnowledgeAccordion', { read: AccordionComponent }) missingKnowledgeAccordion?: AccordionComponent;
  @ViewChildren(AccordionItemComponent) accordionItems?: AccordionItemComponent[];

  period: Observable<RemiPeriods> = this.remiMetrics.period;

  healthCheckData: Observable<RangeChartData[]> = this.remiMetrics.healthCheckData;

  groundednessEvolution: Observable<DatedRangeChartData[]> = this.remiMetrics.groundednessEvolution;
  answerEvolution: Observable<DatedRangeChartData[]> = this.remiMetrics.answerEvolution;
  contextEvolution: Observable<DatedRangeChartData[]> = this.remiMetrics.contextEvolution;
  missingKnowledgeData: Observable<RemiQueryResponseItem[]> = this.remiMetrics.missingKnowledgeData;

  missingKnowledgeDetails: { [id: number]: RemiQueryResponseContextDetails } = {};

  missingKnowledgeCriteria = new FormGroup({
    value: new FormControl<'1' | '2' | '3' | '4' | '5'>('3', { nonNullable: true }),
    month: new FormControl<string>(format(new Date(), 'yyyy-MM'), {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern('\\d{4}-\\d{2}')],
    }),
  });

  ngOnInit() {
    this.loadMissingKnowledge();
    this.missingKnowledgeCriteria.valueChanges
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(() => this.loadMissingKnowledge());
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  updatePeriod(period: RemiPeriods) {
    this.remiMetrics.updatePeriod(period);
  }

  loadMissingKnowledgeDetails(id: number) {
    if (this.missingKnowledgeDetails[id]) {
      return;
    }
    this.remiMetrics.getMissingKnowledgeDetails(id).subscribe((details) => {
      this.missingKnowledgeDetails = { ...this.missingKnowledgeDetails, [id]: details };
      setTimeout(() => {
        const accordionItem = this.accordionItems?.find((item) => item.id === `${id}`);
        if (accordionItem) {
          accordionItem.updateContentHeight();
        }
      });
      this.cdr.detectChanges();
    });
  }

  private loadMissingKnowledge() {
    if (this.missingKnowledgeCriteria.valid) {
      const data = this.missingKnowledgeCriteria.getRawValue();
      const criteria: RemiQueryCriteria = {
        month: data.month,
        context_relevance: {
          value: parseInt(data.value, 10),
          operation: 'lt',
          aggregation: 'max',
        },
      };
      this.remiMetrics.updateCriteria(criteria);
    }
  }
}
