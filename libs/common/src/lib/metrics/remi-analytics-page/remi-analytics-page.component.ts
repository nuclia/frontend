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
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  AccordionBodyDirective,
  AccordionComponent,
  AccordionExtraDescriptionDirective,
  AccordionItemComponent,
  PaButtonModule,
  PaExpanderModule,
  PaIconModule,
  PaTableModule,
  PaTextFieldModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { combineLatest, EMPTY, fromEvent, Observable, Subject } from 'rxjs';
import { auditTime, catchError, map, take, takeUntil } from 'rxjs/operators';
import {
  DatedRangeChartData,
  GroupedBarChartComponent,
  GroupedBarChartData,
  RangeChartComponent,
  RangeChartData,
  RangeEvolutionChartComponent,
  EvolutionSeriesData,
  MultiSeriesEvolutionChartComponent,
} from '../../charts';
import { RemiMetricsService, RemiPeriods } from './remi-metrics.service';
import { InfoCardComponent, SisModalService, SisProgressModule } from '@nuclia/sistema';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { format } from 'date-fns';
import {
  RemiQueryCriteria,
  RemiQueryResponse,
  RemiQueryResponseContextDetails,
  RemiQueryResponseItem,
  SHORT_FIELD_TYPE,
  shortToLongFieldType,
} from '@nuclia/core';
import { DateAfter } from '../../validators';
import { MissingKnowledgeDetailsComponent } from './missing-knowledge-details/missing-knowledge-details.component';
import { openRagAdviceModal } from '../rag-advice/rag-advice.component';
import { AdviceInput } from '../rag-advice/rag-advice.service';
import { PreviewService } from '../../resources';
import { SafeHtml } from '@angular/platform-browser';
import { NavigationService } from '@flaps/core';

/** Shared color palette for the 3 REMI metrics — keep in sync with the evolution chart. */
const METRIC_COLORS: Record<string, string> = {
  answer_relevance: 'var(--color-remi-asnwer-relevance)',
  context_relevance: 'var(--color-remi-context-relevance)',
  groundedness: 'var(--color-remi-groundedness)',
};
const METRIC_COLOR_LIST = [
  METRIC_COLORS['answer_relevance'],
  METRIC_COLORS['context_relevance'],
  METRIC_COLORS['groundedness'],
];

@Component({
  imports: [
    CommonModule,
    TranslateModule,
    PaTextFieldModule,
    RangeChartComponent,
    RangeEvolutionChartComponent,
    MultiSeriesEvolutionChartComponent,
    AccordionComponent,
    AccordionItemComponent,
    AccordionBodyDirective,
    SisProgressModule,
    ReactiveFormsModule,
    InfoCardComponent,
    PaIconModule,
    PaTableModule,
    GroupedBarChartComponent,
    PaExpanderModule,
    AccordionExtraDescriptionDirective,
    MissingKnowledgeDetailsComponent,
    PaButtonModule,
    RouterModule,
    PaTooltipModule,
  ],
  templateUrl: './remi-analytics-page.component.html',
  styleUrl: './remi-analytics-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RemiMetricsService],
})
export class RemiAnalyticsPageComponent implements AfterViewInit, OnInit, OnDestroy {
  private remiMetrics = inject(RemiMetricsService);
  private translate = inject(TranslateService);
  private previewService = inject(PreviewService);
  private navigationService = inject(NavigationService);
  private modalService = inject(SisModalService);
  private cdr = inject(ChangeDetectorRef);

  private unsubscribeAll: Subject<void> = new Subject();

  @ViewChild('missingKnowledgeHeader', { read: ElementRef }) missingKnowledgeHeader?: ElementRef;
  @ViewChildren(AccordionItemComponent) accordionItems?: AccordionItemComponent[];

  period: Observable<RemiPeriods> = this.remiMetrics.period;
  metricColors = METRIC_COLORS;

  healthCheckData: Observable<RangeChartData[]> = this.remiMetrics.healthCheckData.pipe(
    map((data) =>
      data.map((item, i) => ({
        ...item,
        color: METRIC_COLOR_LIST[i],
      })),
    ),
  );

  groundednessEvolution: Observable<DatedRangeChartData[]> = this.remiMetrics.groundednessEvolution;
  answerEvolution: Observable<DatedRangeChartData[]> = this.remiMetrics.answerEvolution;
  contextEvolution: Observable<DatedRangeChartData[]> = this.remiMetrics.contextEvolution;

  evolutionSeries: Observable<EvolutionSeriesData[]> = combineLatest([
    this.remiMetrics.answerEvolution,
    this.remiMetrics.contextEvolution,
    this.remiMetrics.groundednessEvolution,
  ]).pipe(
    map(([answer, context, groundedness]) => [
      {
        key: 'answer_relevance',
        label: this.translate.instant('metrics.remi.category-full.answer_relevance'),
        color: METRIC_COLORS['answer_relevance'],
        data: answer,
        visible: true,
      },
      {
        key: 'context_relevance',
        label: this.translate.instant('metrics.remi.category-full.context_relevance'),
        color: METRIC_COLORS['context_relevance'],
        data: context,
        visible: true,
      },
      {
        key: 'groundedness',
        label: this.translate.instant('metrics.remi.category-full.groundedness'),
        color: METRIC_COLORS['groundedness'],
        data: groundedness,
        visible: true,
      },
    ]),
  );
  lowContextData: Observable<RemiQueryResponse> = this.remiMetrics.missingKnowledgeLowContext;
  noAnswerData: Observable<RemiQueryResponse> = this.remiMetrics.missingKnowledgeNoAnswer;
  badFeedbackData: Observable<RemiQueryResponse> = this.remiMetrics.missingKnowledgeBadFeedback;
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
  badFeedbackCriteria = new FormGroup({
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
  badFeedbackOnError: Observable<boolean> = this.remiMetrics.badFeedbackOnError;
  lowContextPage: Observable<number> = this.remiMetrics.lowContextPage;
  noAnswerPage: Observable<number> = this.remiMetrics.noAnswerPage;
  badFeedbackPage: Observable<number> = this.remiMetrics.badFeedbackPage;

  lowContextLoading: Observable<boolean> = this.remiMetrics.lowContextLoading;
  noAnswerLoading: Observable<boolean> = this.remiMetrics.noAnswerLoading;
  badFeedbackLoading: Observable<boolean> = this.remiMetrics.badFeedbackLoading;

  viewerWidget: Observable<SafeHtml> = this.previewService.viewerWidget.pipe(takeUntil(this.unsubscribeAll));
  kbUrl = this.navigationService.kbUrl;

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
  get badFeedbackMonthControl() {
    return this.badFeedbackCriteria.controls.month;
  }
  get badFeedbackMonthValue() {
    return this.badFeedbackMonthControl.value;
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
    this.loadBadFeedback();
    this.noAnswerCriteria.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => this.loadNoAnswers());
    this.lowContextCriteria.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => this.loadLowContext());
    this.badFeedbackCriteria.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => this.loadBadFeedback());
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
    this.remiMetrics
      .getMissingKnowledgeDetails(id)
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe({
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
      .pipe(
        takeUntil(this.unsubscribeAll),
        catchError(() => EMPTY),
      )
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

  private loadBadFeedback() {
    if (this.badFeedbackCriteria.valid) {
      const month = this.badFeedbackCriteria.getRawValue().month;
      this.remiMetrics.updateBadFeedbackMonth(month);
    }
  }

  updateNoAnswerPage(event: MouseEvent, next: boolean) {
    event.stopPropagation();
    this.remiMetrics.updateNoAnswerPage(next);
  }

  updateLowContextPage(event: MouseEvent, next: boolean) {
    event.stopPropagation();
    this.remiMetrics.updateLowContextPage(next);
  }

  updateBadFeedbackPage(event: MouseEvent, next: boolean) {
    event.stopPropagation();
    this.remiMetrics.updateBadFeedbackPage(next);
  }

  openAdviceForItem(item: RemiQueryResponseItem, event: MouseEvent): void {
    event.stopPropagation();
    if (this.missingKnowledgeDetails[item.id]) {
      this.openAdviceModal(item, this.missingKnowledgeDetails[item.id]);
      return;
    }
    this.remiMetrics
      .getMissingKnowledgeDetails(item.id)
      .pipe(take(1))
      .subscribe({
        next: (details) => {
          this.missingKnowledgeDetails = { ...this.missingKnowledgeDetails, [item.id]: details };
          this.openAdviceModal(item, details);
        },
        error: () => {
          const input: AdviceInput = {
            question: item.question,
            answer: item.answer,
            remiScores: item.remi
              ? {
                  answerRelevance: item.remi.answer_relevance.score,
                  contextRelevance:
                    item.remi.context_relevance.length > 0 ? Math.max(...item.remi.context_relevance) : undefined,
                  groundedness: item.remi.groundedness.length > 0 ? Math.max(...item.remi.groundedness) : undefined,
                }
              : undefined,
            params: {},
          };
          openRagAdviceModal(this.modalService, input);
        },
      });
  }

  onRequestAdvice(item: RemiQueryResponseItem): void {
    if (this.missingKnowledgeDetails[item.id]) {
      this.openAdviceModal(item, this.missingKnowledgeDetails[item.id]);
      return;
    }
    this.remiMetrics
      .getMissingKnowledgeDetails(item.id)
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe({
        next: (details) => {
          this.missingKnowledgeDetails = { ...this.missingKnowledgeDetails, [item.id]: details };
          this.openAdviceModal(item, details);
          this.cdr.detectChanges();
        },
      });
  }

  private openAdviceModal(item: RemiQueryResponseItem, details: RemiQueryResponseContextDetails): void {
    const context = details.context.map((c) => c.text).join('\n\n');
    const input: AdviceInput = {
      question: item.question,
      answer: item.answer,
      context,
      remiScores: item.remi
        ? {
            answerRelevance: item.remi.answer_relevance.score,
            contextRelevance:
              item.remi.context_relevance.length > 0 ? Math.max(...item.remi.context_relevance) : undefined,
            groundedness: item.remi.groundedness.length > 0 ? Math.max(...item.remi.groundedness) : undefined,
          }
        : undefined,
      // RemiQueryResponseItem does not carry per-query RAG params. Pass an empty object so
      // the advisor knows the field was considered rather than silently omitting it.
      params: {},
    };
    openRagAdviceModal(this.modalService, input);
  }
}
