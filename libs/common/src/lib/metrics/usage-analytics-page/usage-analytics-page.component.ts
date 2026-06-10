import { ChangeDetectionStrategy, Component, ViewChild, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { take } from 'rxjs';
import { ActivityLogItem, RemiAnswerStatus } from '@nuclia/core';
import { MetricsMonthRange, UsageAnalyticsItem } from '../metrics-column.model';
import {
  BooleanCondition,
  DateCondition,
  FilterApplyEvent,
  FilterColumnConfig,
  NumericCondition,
  NumericOperation,
} from '../metrics-filters';
import { UsageAnalyticsPageService } from './usage-analytics-page.service';
import { USAGE_ANALYSIS_COLUMNS, USAGE_ANALYSIS_SIDEBAR_FIELDS } from './usage-analytics-page.config';
import { openRagAdviceModal } from '../rag-advice/rag-advice.component';
import { AdviceInput } from '../rag-advice/rag-advice.service';
import { SisModalService } from '@nuclia/sistema';
import { FeaturesService } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MetricsPageComponent, RemiDiagnosis } from '../metrics-page.component';

@Component({
  selector: 'app-usage-analytics-page',
  templateUrl: './usage-analytics-page.component.html',
  styleUrl: './usage-analytics-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
  providers: [UsageAnalyticsPageService],
})
export class UsageAnalyticsPageComponent {
  protected service = inject(UsageAnalyticsPageService);
  private modalService = inject(SisModalService);
  private features = inject(FeaturesService);
  private datePipe = inject(DatePipe);
  private translate = inject(TranslateService);

  @ViewChild(MetricsPageComponent) private metricsPage!: MetricsPageComponent;

  private readonly automaticAdvice = toSignal(this.features.unstable.automaticAdvice, { initialValue: false });

  /**
   * Columns with the inline advice action gated behind the automatic-advice feature flag.
   * The visible() fn closes over the signal so Angular picks up flag changes reactively.
   */
  readonly columns = USAGE_ANALYSIS_COLUMNS.map((col) => {
    if (col.key === 'remiScore' && col.inlineAction) {
      const originalVisible = col.inlineAction.visible;
      return {
        ...col,
        inlineAction: {
          ...col.inlineAction,
          visible: (item: ActivityLogItem) =>
            this.automaticAdvice() && (originalVisible ? originalVisible(item) : true),
        },
      };
    }
    return col;
  });
  readonly sidebarFields = USAGE_ANALYSIS_SIDEBAR_FIELDS;

  readonly resolveRemiDiagnosis = (item: ActivityLogItem): RemiDiagnosis | null => {
    const usageItem = item as UsageAnalyticsItem;
    const issueLabel = usageItem._issueLabel ?? 'No data';

    const map: Record<string, Omit<RemiDiagnosis, 'score'>> = {
      'Context weak': {
        severity: usageItem._issueSeverity ?? 'needs-review',
        mainIssue: 'Context relevance is low.',
        why: 'The answer may look acceptable, but REMi expected stronger retrieved content to support it.',
        recommendedAction: 'Review retrieved sources or add missing content to the Knowledge Box.',
      },
      'Answer weak': {
        severity: usageItem._issueSeverity ?? 'needs-review',
        mainIssue: 'Answer relevance is low.',
        why: 'REMi found that the answer does not directly address the user question.',
        recommendedAction: 'Review the expected answer, prompt behavior, or model response.',
      },
      'Grounding weak': {
        severity: usageItem._issueSeverity ?? 'needs-review',
        mainIssue: 'Groundedness is low.',
        why: 'REMi found claims in the answer that are not strongly supported by the retrieved content.',
        recommendedAction: 'Check whether the answer is supported by citations or retrieved context.',
      },
      'No answer': {
        severity: 'poor',
        mainIssue: 'No answer was generated.',
        why: 'The query did not return enough usable context to generate an answer.',
        recommendedAction: 'Add missing knowledge to the Knowledge Box or review ingestion and retrieval settings.',
      },
      'No major issue': {
        severity: 'good',
        mainIssue: 'No major issue detected.',
        why: 'REMi found the answer, context, and grounding to be acceptable.',
        recommendedAction: 'No action needed.',
      },
      'No data': {
        severity: 'no-data',
        mainIssue: 'REMi data is unavailable.',
        why: 'This query does not have enough REMi evaluation data.',
        recommendedAction: 'Try another date range or check that REMi evaluation is enabled.',
      },
    };

    const diagnosis = map[issueLabel] ?? map['No data'];
    return {
      score: usageItem._remiScore,
      severity: diagnosis.severity,
      issueLabel,
      mainIssue: diagnosis.mainIssue,
      why: diagnosis.why,
      recommendedAction: diagnosis.recommendedAction,
    };
  };

  // ── Filter configs ──────────────────────────────────────────────────────────

  readonly syntheticStatuses = ['SUCCESS', 'ERROR', 'NO_CONTEXT'];

  readonly syntheticStatusLabelsMap: Record<string, string> = {
    SUCCESS: 'activity.remi-analytics.status.success',
    ERROR: 'activity.remi-analytics.status.error',
    NO_CONTEXT: 'activity.remi-analytics.status.no-context',
  };

  readonly filterColumns: FilterColumnConfig[] = [
    { key: 'feedback_good', labelKey: 'activity.filter.feedback', type: 'boolean' },
    {
      key: 'content_relevance',
      labelKey: 'activity.filter.content_relevance',
      type: 'numeric',
      allowedOperations: ['lt', 'gt', 'eq'],
    },
    { key: 'date', labelKey: 'activity.filter.date', type: 'date' },
  ];

  protected activeBooleanConditions = computed<BooleanCondition[]>(() => {
    const fg = this.service.feedbackGoodFilter();
    if (fg !== undefined) {
      return [{ column: 'feedback_good', value: fg }];
    }
    return [];
  });

  protected activeNumericConditions = computed<NumericCondition[]>(() => {
    const cr = this.service.contentRelevanceFilter();
    if (cr) {
      return [{ column: 'content_relevance', operation: cr.operation as NumericOperation, value: cr.value }];
    }
    return [];
  });

  protected syntheticStatusDisabled = computed(() => {
    return this.service.contentRelevanceFilter() !== undefined;
  });

  protected hasManualFilters = computed(() => {
    const statusCount = this.service.activeStatuses().size;
    const hasStatusFilter = statusCount > 0 && statusCount < this.syntheticStatuses.length;

    return (
      hasStatusFilter ||
      this.activeBooleanConditions().length > 0 ||
      this.activeNumericConditions().length > 0 ||
      this.activeDateConditions().length > 0
    );
  });

  protected emptyStateTitleKey = computed(() =>
    this.hasManualFilters() ? 'activity.usage-analysis.empty.no-matching.title' : 'activity.usage-analysis.empty.no-queries.title',
  );

  protected emptyStateDescriptionKey = computed(() =>
    this.hasManualFilters()
      ? 'activity.usage-analysis.empty.no-matching.description'
      : 'activity.usage-analysis.empty.no-queries.description',
  );

  protected emptyStateActionLabelKey = computed(() =>
    this.hasManualFilters() ? 'activity.usage-analysis.empty.reset-filters' : '',
  );

  protected showEmptyStateAction = computed(() => this.hasManualFilters());

  protected selectedMonth = signal<string>(this._currentMonth());
  protected activeDateConditions = computed<DateCondition[]>(() => this.service.dateConditions());

  readonly formattedSelectedMonth = computed(() => {
    const month = this.selectedMonth();
    if (!month) return '';
    const [year, m] = month.split('-');
    return this.datePipe.transform(new Date(Number(year), Number(m) - 1, 1), 'MMMM yyyy') ?? month;
  });

  private _currentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  constructor() {
    this.service.loadData(this._currentMonth());
  }

  // ── Data handlers ─────────────────────────────────────────────────────────

  onMonthRangeChange(range: MetricsMonthRange): void {
    this.service.loadData(range.from);
    this.selectedMonth.set(range.from);
  }

  onLoadNextPage(): void {
    this.service.loadNextPage();
  }

  // ── Filter handlers ───────────────────────────────────────────────────────

  onFiltersApplied(event: FilterApplyEvent): void {
    const statuses = (event.syntheticStatuses ?? this.syntheticStatuses) as RemiAnswerStatus[];
    const feedbackCondition = event.booleanConditions.find((c) => c.column === 'feedback_good');
    const crCondition = event.numericConditions.find((c) => c.column === 'content_relevance');
    const contentRelevance = crCondition
      ? {
          value: crCondition.value,
          operation: crCondition.operation as 'gt' | 'lt' | 'eq',
          aggregation: 'max' as const,
        }
      : undefined;
    this.service.applyAllFilters(statuses, feedbackCondition?.value, contentRelevance, event.dateConditions ?? []);
  }

  resetFiltersFromEmptyState(): void {
    this.service.applyAllFilters(this.syntheticStatuses as RemiAnswerStatus[], undefined, undefined, []);
  }

  // ── Download ──────────────────────────────────────────────────────────────

  downloadLogs(): void {
    this.service.download();
  }

  openAdvice(item: ActivityLogItem): void {
    if (!this.automaticAdvice()) return;

    this.service
      .fetchActivityParams(item.id)
      .pipe(take(1))
      .subscribe((fullItem) => {
        const src = fullItem ?? item;
        const usageItem = item as UsageAnalyticsItem;
        const remiScores =
          usageItem._remiAnswerRelevance != null ||
          usageItem._remiContextRelevance != null ||
          usageItem._remiGroundedness != null
            ? {
                answerRelevance: usageItem._remiAnswerRelevance ?? undefined,
                contextRelevance: usageItem._remiContextRelevance ?? undefined,
                groundedness: usageItem._remiGroundedness ?? undefined,
              }
            : undefined;

        const input: AdviceInput = {
          question: src.question || '',
          answer: src.answer || '',
          remiScores,
          params: {
            minScoreSemantic: src.min_score_semantic ?? undefined,
            minScoreBm25: src.min_score_bm25 ?? undefined,
            topK: src.result_per_page ?? undefined,
            ragStrategies: src.rag_strategies_names ?? undefined,
            model: src.model ?? undefined,
            filter: src.filter ?? undefined,
          },
          status: src.status ?? undefined,
        };
        openRagAdviceModal(this.modalService, input);
      });
  }
}
