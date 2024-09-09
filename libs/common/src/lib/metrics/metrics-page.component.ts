import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
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
  AccordionExtraDescriptionDirective,
  AccordionItemComponent,
  PaExpanderModule,
  PaTableModule,
  PaTextFieldModule,
} from '@guillotinaweb/pastanaga-angular';
import { fromEvent, Observable, Subject } from 'rxjs';
import { auditTime, takeUntil } from 'rxjs/operators';
import {
  DatedRangeChartData,
  GroupedBarChartComponent,
  GroupedBarChartData,
  RangeChartComponent,
  RangeChartData,
  RangeEvolutionChartComponent,
} from '../charts';
import { RemiMetricsService, RemiPeriods } from './remi-metrics.service';
import { InfoCardComponent, SisProgressModule } from '@nuclia/sistema';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { format } from 'date-fns';
import {
  RemiQueryCriteria,
  RemiQueryResponseContextDetails,
  RemiQueryResponseItem,
  SHORT_FIELD_TYPE,
  shortToLongFieldType,
} from '@nuclia/core';
import { DateAfter } from '../validators';
import { MissingKnowledgeDetailsComponent } from './missing-knowledge-details/missing-knowledge-details.component';
import { PreviewService } from '../resources';
import { SafeHtml } from '@angular/platform-browser';

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
    InfoCardComponent,
    PaTableModule,
    GroupedBarChartComponent,
    PaExpanderModule,
    AccordionExtraDescriptionDirective,
    MissingKnowledgeDetailsComponent,
  ],
  templateUrl: './metrics-page.component.html',
  styleUrl: './metrics-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricsPageComponent implements AfterViewInit, OnInit, OnDestroy {
  private remiMetrics = inject(RemiMetricsService);
  private previewService = inject(PreviewService);
  private cdr = inject(ChangeDetectorRef);

  private unsubscribeAll: Subject<void> = new Subject();

  @ViewChild('missingKnowledgeHeader', { read: ElementRef }) missingKnowledgeHeader?: ElementRef;
  @ViewChildren(AccordionItemComponent) accordionItems?: AccordionItemComponent[];

  period: Observable<RemiPeriods> = this.remiMetrics.period;

  healthCheckData: Observable<RangeChartData[]> = this.remiMetrics.healthCheckData;

  groundednessEvolution: Observable<DatedRangeChartData[]> = this.remiMetrics.groundednessEvolution;
  answerEvolution: Observable<DatedRangeChartData[]> = this.remiMetrics.answerEvolution;
  contextEvolution: Observable<DatedRangeChartData[]> = this.remiMetrics.contextEvolution;
  lowContextData: Observable<RemiQueryResponseItem[]> = this.remiMetrics.missingKnowledgeLowContext;
  noAnswerData: Observable<RemiQueryResponseItem[]> = this.remiMetrics.missingKnowledgeNoAnswer;
  missingKnowledgeBarPlotData: Observable<{ [id: number]: GroupedBarChartData[] }> =
    this.remiMetrics.missingKnowledgeBarPlotData;

  missingKnowledgeDetails: { [id: number]: RemiQueryResponseContextDetails } = {};
  missingKnowledgeError: { [id: number]: boolean } = {};

  lowContextCriteria = new FormGroup({
    value: new FormControl<'1' | '2' | '3' | '4' | '5'>('3', { nonNullable: true }),
    month: new FormControl<string>(format(new Date(), 'yyyy-MM'), {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern('\\d{4}-\\d{2}'), DateAfter('2024-08')],
    }),
  });
  noAnswerCriteria = new FormGroup({
    month: new FormControl<string>(format(new Date(), 'yyyy-MM'), {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern('\\d{4}-\\d{2}'), DateAfter('2024-08')],
    }),
  });

  noEvolutionData: Observable<boolean> = this.remiMetrics.noEvolutionData;
  healthStatusOnError: Observable<boolean> = this.remiMetrics.healthStatusOnError;
  evolutionDataOnError: Observable<boolean> = this.remiMetrics.evolutionDataOnError;
  lowContextOnError: Observable<boolean> = this.remiMetrics.lowContextOnError;
  noAnswerOnError: Observable<boolean> = this.remiMetrics.noAnswerOnError;

  viewerWidget: Observable<SafeHtml> = this.previewService.viewerWidget.pipe(takeUntil(this.unsubscribeAll));

  get lowContextMonthControl() {
    return this.lowContextCriteria.controls.month;
  }
  get lowControlMonthValue() {
    return this.lowContextMonthControl.value;
  }
  get criteriaPercentValue() {
    return parseInt(this.lowContextCriteria.controls.value.getRawValue(), 10) * 20 + '%';
  }
  get noAnswerMonthControl() {
    return this.noAnswerCriteria.controls.month;
  }
  get noAnswerMonthValue() {
    return this.noAnswerMonthControl.value;
  }

  missingKnowledgeHeaderHeight = '';

  ngAfterViewInit() {
    if (this.missingKnowledgeHeader) {
      this.missingKnowledgeHeaderHeight = `--header-height:${this.missingKnowledgeHeader.nativeElement.offsetHeight}px`;
      fromEvent(window, 'resize')
        .pipe(auditTime(200), takeUntil(this.unsubscribeAll))
        .subscribe(() => {
          if (this.missingKnowledgeHeader) {
            this.missingKnowledgeHeaderHeight = `--header-height:${this.missingKnowledgeHeader.nativeElement.offsetHeight}px`;
            this.cdr.detectChanges();
          }
        });
    }
  }

  ngOnInit() {
    this.loadNoAnswers();
    this.loadLowContext();
    this.noAnswerCriteria.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => this.loadNoAnswers());
    this.lowContextCriteria.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => this.loadLowContext());
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
    this.remiMetrics.getMissingKnowledgeDetails(id).subscribe({
      next: (details) => {
        this.missingKnowledgeDetails = { ...this.missingKnowledgeDetails, [id]: details };
        this.missingKnowledgeError = { ...this.missingKnowledgeError, [id]: false };
        setTimeout(() => {
          const accordionItem = this.accordionItems?.find((item) => item.id === `${id}`);
          if (accordionItem) {
            accordionItem.updateContentHeight();
          }
        });
        this.cdr.detectChanges();
      },
      error: () => {
        this.missingKnowledgeError = { ...this.missingKnowledgeError, [id]: true };
        this.cdr.detectChanges();
      },
    });
  }

  openViewer(contextId: string) {
    const [resourceId, fieldType, fieldId] = contextId.split('/');
    if (!resourceId || !fieldType || !fieldId) {
      console.error(`Malformed context id ${contextId}:`, resourceId, fieldType, fieldId);
      return;
    }
    const longFieldType = shortToLongFieldType(fieldType as SHORT_FIELD_TYPE);
    if (!longFieldType) {
      console.error(`Unknown field type ${fieldType}`);
      return;
    }
    this.previewService
      .openViewer({
        resourceId: resourceId,
        field_type: longFieldType,
        field_id: fieldId,
      })
      .subscribe();
  }

  private loadLowContext() {
    if (this.lowContextCriteria.valid) {
      const data = this.lowContextCriteria.getRawValue();
      const criteria: RemiQueryCriteria = {
        month: data.month,
        context_relevance: {
          value: parseInt(data.value, 10),
          operation: 'lt',
          aggregation: 'max',
        },
      };
      this.remiMetrics.updateLowContextCriteria(criteria);
    }
  }

  private loadNoAnswers() {
    if (this.noAnswerCriteria.valid) {
      const month = this.noAnswerCriteria.getRawValue().month;
      this.remiMetrics.updateNoAnswerMonth(month);
    }
  }
}
