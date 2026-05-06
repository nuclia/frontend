import { Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, Subject, catchError, forkJoin, map, of, switchMap, take } from 'rxjs';
import {
  ACTIVITY_LOG_ASK_SHOW_FIELDS,
  ActivityLogAskFilters,
  ActivityLogAskQuery,
  ActivityLogItem,
  EventType,
  Metric,
  RemiAnswerStatus,
  RemiQueryCriteria,
  RemiQueryResponse,
  RemiQueryResponseItem,
  RemiScoresResponseItem,
} from '@nuclia/core';
import { UserService } from '@flaps/core';
import { SisToastService } from '@nuclia/sistema';
import { UsageAnalyticsItem } from '../metrics-column.model';
import { applyDateConditions, getMonthRange } from '../metrics-utils';
import { AbstractMetricsPageService } from '../abstract-metrics-page.service';
import { DateCondition } from '../metrics-filters';

const STATUSES: RemiAnswerStatus[] = ['SUCCESS', 'ERROR', 'NO_CONTEXT'];

/** Maps the RemiAnswerStatus label to the numeric status code used in ActivityLog filters. */
const REMI_STATUS_CODE_MAP: Record<RemiAnswerStatus, string> = {
  SUCCESS: '0',
  ERROR: '-1',
  NO_CONTEXT: '-2',
};

/** Maps visible column keys to download `show` fields. */
const COLUMN_TO_SHOW_FIELD: Record<string, string> = {
  date: 'date',
  question: 'question',
  answer: 'answer',
  status: 'status',
};

/** Column keys whose data is exposed via the `remi_scores` download field. */
const REMI_COLUMN_KEYS = new Set(['remiScore', 'answerRelevance', 'contentRelevance', 'groundedness']);

interface StatusPageState {
  hasMore: boolean;
  lastId: number | undefined;
}

type StatusPageMap = Record<RemiAnswerStatus, StatusPageState>;

/** Default values for all ActivityLogItem fields not provided by the REMI API. */
const REMI_PROVIDED_FIELDS = ['id', 'question', 'answer', 'status', 'remi_scores'] as const;
const NULL_ACTIVITY_FIELDS = Object.fromEntries(
  ACTIVITY_LOG_ASK_SHOW_FIELDS.filter((f) => !(REMI_PROVIDED_FIELDS as readonly string[]).includes(f)).map((f) => [
    f,
    null,
  ]),
) as Omit<ActivityLogItem, (typeof REMI_PROVIDED_FIELDS)[number]>;

@Injectable()
export class UsageAnalyticsPageService extends AbstractMetricsPageService<UsageAnalyticsItem> {
  private user = inject(UserService);
  private toaster = inject(SisToastService);
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
  private _dateConditions = signal<DateCondition[]>([]);

  readonly remiScoreAverages = this._remiScoreAverages.asReadonly();
  readonly activeStatuses = this._activeStatuses.asReadonly();
  readonly feedbackGoodFilter = this._feedbackGoodFilter.asReadonly();
  readonly contentRelevanceFilter = this._contentRelevanceFilter.asReadonly();
  readonly dateConditions = this._dateConditions.asReadonly();

  private readonly _loadScores$ = new Subject<string>();

  constructor() {
    super();
    this.initPipeline();
    this.loadAvailableMonths();

    this._loadScores$
      .pipe(
        switchMap((yearMonth) => {
          const { from, to } = getMonthRange(yearMonth);
          return this.sdk.currentKb.pipe(
            take(1),
            switchMap((kb) => kb.activityMonitor.getRemiScores(from, to)),
            catchError((err) => {
              console.error('[UsageAnalyticsPageService] failed to load REMi score averages', err);
              return of([] as RemiScoresResponseItem[]);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((items) => {
        this._remiScoreAverages.set(this._computeRemiAverages(items));
      });
  }

  protected loadAvailableMonths(): void {
    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) => kb.activityMonitor.getMonthsWithActivity(EventType.ASK)),
        map((res) => [...res.downloads].sort((a, b) => b.localeCompare(a))),
      )
      .subscribe({
        next: (months) => this._availableMonths.set(months),
        error: () => {
          /* empty */
        },
      });
  }

  protected override _resetPaginationState(): void {
    this._resetStatusPages();
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
    contentRelevance:
      | { value: number; operation: 'gt' | 'lt' | 'eq'; aggregation: 'average' | 'min' | 'max' }
      | undefined,
    dateConditions: DateCondition[] = [],
  ): void {
    // If contentRelevance is set, we cannot filter by status (API constraint)
    if (contentRelevance) {
      this._activeStatuses.set(new Set(STATUSES));
    } else {
      this._activeStatuses.set(new Set(statuses));
    }
    this._feedbackGoodFilter.set(feedbackGood);
    this._contentRelevanceFilter.set(contentRelevance);
    this._dateConditions.set(dateConditions);
    this._applyFilters();
  }

  private _resetStatusPages(): void {
    for (const status of STATUSES) {
      this._statusPages[status] = { hasMore: false, lastId: undefined };
    }
    this._hasMore.set(false);
  }

  protected _queryPage(isAppend: boolean): Observable<UsageAnalyticsItem[]> {
    return this._queryAllStatuses(isAppend);
  }

  private _queryAllStatuses(isAppend: boolean) {
    const yearMonth = this._yearMonth();
    const feedbackGood = this._feedbackGoodFilter();
    const contextRelevance = this._contentRelevanceFilter();
    const dateConditions = this._dateConditions();

    // If contentRelevance is set, we cannot filter by status (API constraint:
    // "Only one of [context_relevance, status_code] can be set")
    if (contextRelevance) {
      return this._querySinglePage(yearMonth, isAppend, feedbackGood, contextRelevance, dateConditions);
    }

    // Normal per-status queries
    const active = this._activeStatuses();
    const statusesToQuery = isAppend
      ? STATUSES.filter((s) => active.has(s) && this._statusPages[s].hasMore)
      : STATUSES.filter((s) => active.has(s));

    if (statusesToQuery.length === 0) {
      return of([] as UsageAnalyticsItem[]);
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
                  ? { limit: this.PAGE_SIZE, starting_after: state.lastId }
                  : { limit: this.PAGE_SIZE },
            };
            if (feedbackGood !== undefined) {
              criteria.feedback_good = feedbackGood;
            }
            if (dateConditions.length > 0) {
              const dc = dateConditions[0];
              if (dc.from) criteria.from_date = dc.from;
              if (dc.to) criteria.to_date = dc.to;
            }
            return kb.activityMonitor.queryRemiScores(criteria).pipe(
              map((response) => ({ status, response })),
              catchError(() => of({ status, response: { data: [], has_more: false } as RemiQueryResponse })),
            );
          }),
        ),
      ),
      map((results) => {
        // Update pagination state (side effects)
        results.forEach(({ status, response }) => {
          this._statusPages[status].hasMore = response.has_more;
          const lastItem = response.data.at(-1);
          if (lastItem) this._statusPages[status].lastId = lastItem.id;
        });
        this._hasMore.set(STATUSES.some((s) => active.has(s) && this._statusPages[s].hasMore));
        // Map data (functional)
        return results
          .flatMap(({ status, response }) => response.data.map((item) => this._mapToUsageItem(item, status)))
          .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));
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
    dateConditions: DateCondition[] = [],
  ) {
    // Use 'SUCCESS' page state as shared pagination tracker
    const pageState = this._statusPages['SUCCESS'];
    const pagination =
      isAppend && pageState.lastId !== undefined
        ? { limit: this.PAGE_SIZE, starting_after: pageState.lastId }
        : { limit: this.PAGE_SIZE };

    const criteria: RemiQueryCriteria = {
      month: yearMonth,
      context_relevance: contextRelevance,
      pagination,
    };
    if (feedbackGood !== undefined) {
      criteria.feedback_good = feedbackGood;
    }
    if (dateConditions.length > 0) {
      const dc = dateConditions[0];
      if (dc.from) criteria.from_date = dc.from;
      if (dc.to) criteria.to_date = dc.to;
    }

    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        kb.activityMonitor
          .queryRemiScores(criteria)
          .pipe(catchError(() => of({ data: [], has_more: false } as RemiQueryResponse))),
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

  protected _applyPage(newItems: UsageAnalyticsItem[], isAppend: boolean): void {
    if (isAppend) {
      this._items.update((prev) => [...prev, ...newItems].sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')));
      this._loadingMore.set(false);
    } else {
      this._items.set(newItems);
      this._loading.set(false);
    }
  }

  private _mapToUsageItem(remiItem: RemiQueryResponseItem, status: RemiAnswerStatus | null): UsageAnalyticsItem {
    const answerRelevance = remiItem.remi?.answer_relevance?.score ?? null;
    const contentRelevanceArr = remiItem.remi?.context_relevance ?? [];
    const groundednessArr = remiItem.remi?.groundedness ?? [];

    const contentRelevance =
      contentRelevanceArr.length > 0
        ? Math.round((10 * contentRelevanceArr.reduce((a, b) => a + b, 0)) / contentRelevanceArr.length) / 10
        : null;
    const groundedness = groundednessArr.length > 0 ? Math.max(...groundednessArr) : null;

    const remiScores = [answerRelevance, contentRelevance, groundedness].filter((v): v is number => v !== null);
    const remiScore = remiScores.length > 0 ? Math.min(...remiScores) : null;

    return {
      ...NULL_ACTIVITY_FIELDS,
      id: remiItem.id,
      question: remiItem.question,
      answer: remiItem.answer,
      date: remiItem.date ?? null,
      status,
      remi_scores: remiScore,
      _displayStatus: status ? this._translateStatus(status) : '—',
      _rawStatus: status ?? null,
      _remiScore: remiScore,
      _remiAnswerRelevance: answerRelevance,
      _remiContextRelevance: contentRelevance,
      _remiGroundedness: groundedness,
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

  download(visibleColumns: string[]): void {
    const show = this._buildShowFields(visibleColumns);
    const filters = this._buildDownloadFilters();
    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) =>
          kb.activityMonitor.createActivityLogDownload(
            EventType.ASK,
            { year_month: this._yearMonth(), show, filters, notify_via_email: true },
            'application/x-ndjson',
          ),
        ),
        switchMap(() => this.user.userPrefs),
        map((u) => u?.email ?? ''),
        take(1),
        catchError((err) => {
          console.error('[UsageAnalyticsPageService] download failed', err);
          this.toaster.error('activity.download-error');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((email) => {
        this.toaster.success(this.translate.instant('activity.email-sent', { email }));
      });
  }

  private _buildShowFields(visibleColumns: string[]): string[] {
    const fields = new Set<string>();
    for (const key of visibleColumns) {
      if (COLUMN_TO_SHOW_FIELD[key]) {
        fields.add(COLUMN_TO_SHOW_FIELD[key]);
      }
      if (REMI_COLUMN_KEYS.has(key)) {
        fields.add('remi_scores');
      }
    }
    return Array.from(fields);
  }

  private _buildDownloadFilters(): ActivityLogAskFilters {
    const filters: Record<string, unknown> = {};

    applyDateConditions(this._dateConditions(), filters);

    // Status filter: skip when content-relevance filter is active (API constraint) or all 3 statuses selected.
    // 1 active → eq; 2 active → ne on the excluded one (note: ne may include rare -3/NO_RETRIEVAL_DATA rows).
    if (!this._contentRelevanceFilter()) {
      const active = this._activeStatuses();
      if (active.size === 1) {
        const [singleStatus] = active;
        filters['status'] = { eq: REMI_STATUS_CODE_MAP[singleStatus] };
      } else if (active.size === 2) {
        const [excluded] = STATUSES.filter((s) => !active.has(s));
        filters['status'] = { ne: REMI_STATUS_CODE_MAP[excluded] };
      }
    }

    return filters as ActivityLogAskFilters;
  }

  fetchActivityParams(id: number): Observable<ActivityLogItem | null> {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        kb.activityMonitor.queryActivityLogs(EventType.ASK, {
          year_month: this._yearMonth(),
          show: 'all',
          filters: { id: { eq: id } },
          pagination: { limit: 1 },
        } as ActivityLogAskQuery),
      ),
      map((items) => items[0] ?? null),
      catchError(() => of(null)),
    );
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
