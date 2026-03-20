import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, exhaustMap, forkJoin, map, of, switchMap, take } from 'rxjs';
import { SDKService } from '@flaps/core';
import {
  ActivityLogItem,
  EventType,
  Metric,
  RemiAnswerStatus,
  RemiQueryCriteria,
  RemiQueryResponse,
  RemiQueryResponseItem,
  RemiScoresResponseItem,
} from '@nuclia/core';
import { TranslateService } from '@ngx-translate/core';
import { UsageAnalysisItem } from './usage-analysis-page.config';

const STATUSES: RemiAnswerStatus[] = ['SUCCESS', 'ERROR', 'NO_CONTEXT'];
const PAGE_SIZE = 100;

interface StatusPageState {
  hasMore: boolean;
  lastId: number | undefined;
}

type StatusPageMap = Record<RemiAnswerStatus, StatusPageState>;

/** Default values for all ActivityLogItem fields not provided by the REMI API. */
const NULL_ACTIVITY_FIELDS: Omit<ActivityLogItem, 'id' | 'question' | 'answer' | 'status' | 'remi_scores'> = {
  date: null,
  user_id: null,
  user_type: null,
  client_type: null,
  total_duration: null,
  audit_metadata: null,
  resource_id: null,
  nuclia_tokens: null,
  resources_count: null,
  filter: null,
  retrieval_rephrased_question: null,
  vectorset: null,
  security: null,
  min_score_bm25: null,
  min_score_semantic: null,
  result_per_page: null,
  retrieval_time: null,
  rephrased_question: null,
  learning_id: null,
  retrieved_context: null,
  chat_history: null,
  feedback_good: null,
  feedback_comment: null,
  feedback_good_all: null,
  feedback_good_any: null,
  feedback: null,
  model: null,
  rag_strategies_names: null,
  rag_strategies: null,
  generative_answer_first_chunk_time: null,
  generative_reasoning_first_chunk_time: null,
  generative_answer_time: null,
  user_request: null,
  reasoning: null,
};

@Injectable()
export class UsageAnalysisPageService {
  private sdk = inject(SDKService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  private _items = signal<UsageAnalysisItem[]>([]);
  private _loading = signal(false);
  private _loadingMore = signal(false);
  private _availableMonths = signal<string[]>([]);
  private _yearMonth = signal('');
  private _hasMore = signal(false);
  private _remiScoreAverages = signal<{
    answerRelevance: number | null;
    contextRelevance: number | null;
    groundedness: number | null;
  }>({ answerRelevance: null, contextRelevance: null, groundedness: null });
  private _statusPages: StatusPageMap = {
    SUCCESS: { hasMore: false, lastId: undefined },
    ERROR: { hasMore: false, lastId: undefined },
    NO_CONTEXT: { hasMore: false, lastId: undefined },
  };

  // Filter state
  private _activeStatuses = signal<Set<RemiAnswerStatus>>(new Set(STATUSES));
  private _feedbackGoodFilter = signal<boolean | undefined>(undefined);
  private _contentRelevanceFilter = signal<
    { value: number; operation: 'gt' | 'lt' | 'eq'; aggregation: 'average' | 'min' | 'max' } | undefined
  >(undefined);

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly loadingMore = this._loadingMore.asReadonly();
  readonly availableMonths = this._availableMonths.asReadonly();
  readonly hasMore = this._hasMore.asReadonly();
  readonly remiScoreAverages = this._remiScoreAverages.asReadonly();
  readonly activeStatuses = this._activeStatuses.asReadonly();
  readonly feedbackGoodFilter = this._feedbackGoodFilter.asReadonly();
  readonly contentRelevanceFilter = this._contentRelevanceFilter.asReadonly();

  private readonly _reset$ = new Subject<void>();
  private readonly _nextPage$ = new Subject<void>();
  private readonly _loadScores$ = new Subject<string>();

  constructor() {
    this._reset$
      .pipe(
        switchMap(() =>
          this._queryAllStatuses(false).pipe(
            catchError((err) => {
              console.error('[UsageAnalysisPageService] failed to load data', err);
              this._items.set([]);
              this._loading.set(false);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ next: (items) => this._applyPage(items, false) });

    this._nextPage$
      .pipe(
        exhaustMap(() =>
          this._queryAllStatuses(true).pipe(
            catchError((err) => {
              console.error('[UsageAnalysisPageService] failed to load next page', err);
              this._loadingMore.set(false);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ next: (items) => this._applyPage(items, true) });

    this._loadScores$
      .pipe(
        switchMap((yearMonth) => {
          const { from, to } = this._getMonthRange(yearMonth);
          return this.sdk.currentKb.pipe(
            take(1),
            switchMap((kb) => kb.activityMonitor.getRemiScores(from, to)),
            catchError((err) => {
              console.error('[UsageAnalysisPageService] failed to load REMi score averages', err);
              return of([] as RemiScoresResponseItem[]);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((items) => {
        this._remiScoreAverages.set(this._computeRemiAverages(items));
      });

    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) => kb.activityMonitor.getMonthsWithActivity(EventType.ASK)),
        map((res) => [...res.downloads].sort((a, b) => b.localeCompare(a))),
      )
      .subscribe({
        next: (months) => this._availableMonths.set(months),
        error: () => {},
      });
  }

  loadData(yearMonth: string): void {
    if (!yearMonth) return;
    this._yearMonth.set(yearMonth);
    this._resetStatusPages();
    this._items.set([]);
    this._loading.set(true);
    this._remiScoreAverages.set({ answerRelevance: null, contextRelevance: null, groundedness: null });
    this._reset$.next();
    this._loadScores$.next(yearMonth);
  }

  loadNextPage(): void {
    if (!this._hasMore() || this._loading() || this._loadingMore()) return;
    this._loadingMore.set(true);
    this._nextPage$.next();
  }

  updateActiveStatuses(statuses: RemiAnswerStatus[]): void {
    this._activeStatuses.set(new Set(statuses));
    this._applyFilters();
  }

  updateFeedbackGoodFilter(value: boolean | undefined): void {
    this._feedbackGoodFilter.set(value);
    this._applyFilters();
  }

  updateContentRelevanceFilter(
    filter: { value: number; operation: 'gt' | 'lt' | 'eq'; aggregation: 'average' | 'min' | 'max' } | undefined,
  ): void {
    this._contentRelevanceFilter.set(filter);
    this._applyFilters();
  }

  applyAllFilters(
    statuses: RemiAnswerStatus[],
    feedbackGood: boolean | undefined,
    contentRelevance: { value: number; operation: 'gt' | 'lt' | 'eq'; aggregation: 'average' | 'min' | 'max' } | undefined,
  ): void {
    // If contentRelevance is set, we cannot filter by status (API constraint)
    if (contentRelevance) {
      this._activeStatuses.set(new Set(STATUSES));
    } else {
      this._activeStatuses.set(new Set(statuses));
    }
    this._feedbackGoodFilter.set(feedbackGood);
    this._contentRelevanceFilter.set(contentRelevance);
    this._applyFilters();
  }

  private _applyFilters(): void {
    if (!this._yearMonth()) return;
    this._resetStatusPages();
    this._items.set([]);
    this._loading.set(true);
    this._reset$.next();
  }

  private _resetStatusPages(): void {
    for (const status of STATUSES) {
      this._statusPages[status] = { hasMore: false, lastId: undefined };
    }
    this._hasMore.set(false);
  }

  private _queryAllStatuses(isAppend: boolean) {
    const yearMonth = this._yearMonth();
    const feedbackGood = this._feedbackGoodFilter();
    const contextRelevance = this._contentRelevanceFilter();

    // If contentRelevance is set, we cannot filter by status (API constraint:
    // "Only one of [context_relevance, status_code] can be set")
    if (contextRelevance) {
      return this._querySinglePage(yearMonth, isAppend, feedbackGood, contextRelevance);
    }

    // Normal per-status queries
    const active = this._activeStatuses();
    const statusesToQuery = isAppend
      ? STATUSES.filter((s) => active.has(s) && this._statusPages[s].hasMore)
      : STATUSES.filter((s) => active.has(s));

    if (statusesToQuery.length === 0) {
      return of([] as UsageAnalysisItem[]);
    }

    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        forkJoin(
          statusesToQuery.map((status) => {
            const state = this._statusPages[status];
            const criteria: RemiQueryCriteria = {
              month: yearMonth,
              status,
              pagination:
                isAppend && state.lastId !== undefined
                  ? { limit: PAGE_SIZE, starting_after: state.lastId }
                  : { limit: PAGE_SIZE },
            };
            if (feedbackGood !== undefined) {
              criteria.feedback_good = feedbackGood;
            }
            return kb.activityMonitor.queryRemiScores(criteria).pipe(
              map((response) => ({ status, response })),
              catchError(() => of({ status, response: { data: [], has_more: false } as RemiQueryResponse })),
            );
          }),
        ),
      ),
      map((results) => {
        const merged: UsageAnalysisItem[] = [];
        for (const { status, response } of results) {
          this._statusPages[status].hasMore = response.has_more;
          const lastItem = response.data[response.data.length - 1];
          if (lastItem) {
            this._statusPages[status].lastId = lastItem.id;
          }
          for (const item of response.data) {
            merged.push(this._mapToUsageItem(item, status));
          }
        }
        this._hasMore.set(STATUSES.some((s) => active.has(s) && this._statusPages[s].hasMore));
        return merged.sort((a, b) => b.id - a.id);
      }),
    );
  }

  /**
   * Single-query mode used when contentRelevance is set.
   * The REMI API does not allow context_relevance and status to be combined,
   * so we send a single query without status and use the 'SUCCESS' page state
   * for shared pagination tracking.
   */
  private _querySinglePage(
    yearMonth: string,
    isAppend: boolean,
    feedbackGood: boolean | undefined,
    contextRelevance: { value: number; operation: 'gt' | 'lt' | 'eq'; aggregation: 'average' | 'min' | 'max' },
  ) {
    // Use 'SUCCESS' page state as shared pagination tracker
    const pageState = this._statusPages['SUCCESS'];
    const pagination =
      isAppend && pageState.lastId !== undefined
        ? { limit: PAGE_SIZE, starting_after: pageState.lastId }
        : { limit: PAGE_SIZE };

    const criteria: RemiQueryCriteria = {
      month: yearMonth,
      context_relevance: contextRelevance,
      pagination,
    };
    if (feedbackGood !== undefined) {
      criteria.feedback_good = feedbackGood;
    }

    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        kb.activityMonitor.queryRemiScores(criteria).pipe(
          catchError(() => of({ data: [], has_more: false } as RemiQueryResponse)),
        ),
      ),
      map((response) => {
        pageState.hasMore = response.has_more;
        const lastItem = response.data[response.data.length - 1];
        if (lastItem) pageState.lastId = lastItem.id;
        this._hasMore.set(response.has_more);

        // RemiQueryResponseItem does not include a status field when querying by
        // context_relevance (API constraint: "Only one of [context_relevance, status_code]").
        // Status is unknown here, so we pass null to display '—' instead of a misleading value.
        return response.data.map((item) => this._mapToUsageItem(item, null));
      }),
    );
  }

  private _applyPage(newItems: UsageAnalysisItem[], isAppend: boolean): void {
    if (isAppend) {
      this._items.update((prev) => [...prev, ...newItems].sort((a, b) => b.id - a.id));
      this._loadingMore.set(false);
    } else {
      this._items.set(newItems);
      this._loading.set(false);
    }
  }

  private _mapToUsageItem(remiItem: RemiQueryResponseItem, status: RemiAnswerStatus | null): UsageAnalysisItem {
    return {
      ...NULL_ACTIVITY_FIELDS,
      id: remiItem.id,
      question: remiItem.question,
      answer: remiItem.answer,
      status,
      remi_scores: remiItem.remi?.answer_relevance?.score ?? null,
      _displayStatus: status ? this._translateStatus(status) : '—',
      _remiScore: remiItem.remi?.answer_relevance?.score ?? null,
    };
  }

  private _translateStatus(status: RemiAnswerStatus): string {
    const statusKeys: Record<RemiAnswerStatus, string> = {
      SUCCESS: 'activity.remi-analytics.status.success',
      ERROR: 'activity.remi-analytics.status.error',
      NO_CONTEXT: 'activity.remi-analytics.status.no-context',
    };
    return this.translate.instant(statusKeys[status]);
  }

  private _getMonthRange(yearMonth: string): { from: string; to: string } {
    const [year, month] = yearMonth.split('-');
    const lastDay = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
    return {
      from: `${yearMonth}-01`,
      to: `${yearMonth}-${String(lastDay).padStart(2, '0')}`,
    };
  }

  private _computeRemiAverages(items: RemiScoresResponseItem[]): {
    answerRelevance: number | null;
    contextRelevance: number | null;
    groundedness: number | null;
  } {
    if (items.length === 0) {
      return { answerRelevance: null, contextRelevance: null, groundedness: null };
    }

    const averageForMetric = (name: string): number | null => {
      const values = items
        .map((item) => item.metrics.find((m: Metric) => m.name === name))
        .filter((m): m is Metric => !!m)
        .map((m) => m.average);
      return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : null;
    };

    return {
      answerRelevance: averageForMetric('answer_relevance'),
      contextRelevance: averageForMetric('context_relevance'),
      groundedness: averageForMetric('groundedness'),
    };
  }
}
