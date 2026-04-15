import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
import { getRemiColorClass } from '../metrics-utils';
import { FeaturesService } from '@flaps/core';
import { toSignal } from '@angular/core/rxjs-interop';

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

  protected selectedMonth = signal<string>(this._currentMonth());
  protected activeDateConditions = computed<DateCondition[]>(() => this.service.dateConditions());

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

  remiColor(val: number | null): string {
    const cls = getRemiColorClass(val);
    return cls ? `remi-${cls}` : '';
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
