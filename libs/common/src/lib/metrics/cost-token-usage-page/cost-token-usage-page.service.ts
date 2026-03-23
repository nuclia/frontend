import { Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, Subject, catchError, forkJoin, map, of, switchMap, take } from 'rxjs';
import { UserService } from '@flaps/core';
import {
  ActivityLogAskFilters,
  ActivityLogItem,
  ActivityLogPagination,
  DownloadFormat,
  EventType,
  UsagePoint,
} from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { NumericCondition } from '../metrics-filters';
import { CostTokenStats } from '../metrics-column.model';
import { aggregateUsageMetric, applyNumericConditions, applyTextSearchFilter, getMonthRange } from '../metrics-utils';
import { COST_TOKEN_SHOW_FIELDS } from './cost-token-usage-page.config';
import { AbstractMetricsPageService } from '../abstract-metrics-page.service';

@Injectable()
export class CostTokenUsagePageService extends AbstractMetricsPageService<ActivityLogItem> {
  private user = inject(UserService);
  private toaster = inject(SisToastService);

  private _usageStats = signal<CostTokenStats>({
    aiTokensUsed: null, nucliaTokens: null, nucliaTokensBilled: null,
  });
  private _search = signal<{ term: string; column: string } | null>(null);
  private _lastId = signal<number | undefined>(undefined);
  private _booleanFilters = signal<Record<string, boolean | undefined>>({});
  private _numericConditions = signal<NumericCondition[]>([]);

  readonly usageStats = this._usageStats.asReadonly();
  readonly booleanFilters = this._booleanFilters.asReadonly();
  readonly numericConditions = this._numericConditions.asReadonly();

  private readonly _loadUsage$ = new Subject<string>();

  constructor() {
    super();
    this.initPipeline();
    this.loadAvailableMonths();

    this._loadUsage$
      .pipe(
        switchMap((yearMonth) => {
          const { from, to } = getMonthRange(yearMonth);
          return forkJoin([this.sdk.currentAccount.pipe(take(1)), this.sdk.currentKb.pipe(take(1))]).pipe(
            switchMap(([account, kb]) => this.sdk.nuclia.db.getUsage(account.id, from, to, kb.id)),
            catchError((err) => {
              console.error('[CostTokenUsagePageService] failed to load usage stats', err);
              return of([] as UsagePoint[]);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((usagePoints) => {
        this._usageStats.set(this._extractUsageMetrics(usagePoints));
      });
  }

  protected loadAvailableMonths(): void {
    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) => kb.activityMonitor.getMonthsWithActivity(EventType.ASK)),
      )
      .subscribe({
        next: (res) => this._availableMonths.set([...res.downloads].sort((a, b) => b.localeCompare(a))),
        error: () => {},
      });
  }

  protected override _resetPaginationState(): void {
    super._resetPaginationState();
    this._lastId.set(undefined);
  }

  private _buildFilters(): ActivityLogAskFilters {
    const filters: Record<string, unknown> = {};

    applyTextSearchFilter(this._search(), filters);

    // Boolean sidebar filters
    Object.entries(this._booleanFilters())
      .filter(([, value]) => value !== undefined)
      .forEach(([key, value]) => { filters[key] = { eq: value }; });

    // Numeric sidebar filters (status is ActivityLogFilter<string> in the API)
    applyNumericConditions(this._numericConditions(), filters, ['status']);

    return filters as ActivityLogAskFilters;
  }

  protected _queryPage(isAppend: boolean): Observable<ActivityLogItem[]> {
    const pagination: ActivityLogPagination =
      isAppend && this._lastId() !== undefined
        ? { limit: this.PAGE_SIZE, starting_after: this._lastId() }
        : { limit: this.PAGE_SIZE };
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        kb.activityMonitor.queryActivityLogs(EventType.ASK, {
          year_month: this._yearMonth(),
          show: COST_TOKEN_SHOW_FIELDS,
          filters: this._buildFilters(),
          pagination,
        }),
      ),
    );
  }

  protected _applyPage(newItems: ActivityLogItem[], isAppend: boolean): void {
    const lastId = newItems.length > 0 ? newItems[newItems.length - 1].id : undefined;
    this._hasMore.set(newItems.length >= this.PAGE_SIZE);
    if (lastId !== undefined) this._lastId.set(lastId);
    const combined = isAppend ? [...this._items(), ...newItems] : newItems;
    this._items.set(combined);
    if (isAppend) {
      this._loadingMore.set(false);
    } else {
      this._loading.set(false);
    }
  }

  loadData(yearMonth: string): void {
    if (!yearMonth) return;
    this._yearMonth.set(yearMonth);
    this._search.set(null);
    this._lastId.set(undefined);
    this._hasMore.set(false);
    this._items.set([]);
    this._usageStats.set({ aiTokensUsed: null, nucliaTokens: null, nucliaTokensBilled: null });
    this._loading.set(true);
    this._reset$.next();
    this._loadUsage$.next(yearMonth);
  }

  setSearch(term: string, column: string): void {
    this._search.set(term ? { term, column } : null);
    this._lastId.set(undefined);
    this._hasMore.set(false);
    this._items.set([]);
    this._loading.set(true);
    this._reset$.next();
  }

  updateBooleanFilter(key: string, value: boolean | undefined): void {
    this._booleanFilters.update((prev) => ({ ...prev, [key]: value }));
    this._applyFilters();
  }

  updateNumericConditions(conditions: NumericCondition[]): void {
    this._numericConditions.set(conditions);
    this._applyFilters();
  }

  applyAllFilters(booleans: Record<string, boolean | undefined>, numericConditions: NumericCondition[]): void {
    this._booleanFilters.set(booleans);
    this._numericConditions.set(numericConditions);
    this._applyFilters();
  }

  download(format: DownloadFormat, columns: string[]): void {
    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) =>
          kb.activityMonitor.createActivityLogDownload(
            EventType.ASK,
            {
              year_month: this._yearMonth(),
              filters: this._buildFilters(),
              notify_via_email: true,
              show: columns,
            },
            format,
          ),
        ),
        switchMap(() => this.user.userPrefs),
        map((u) => u?.email ?? ''),
        take(1),
        catchError((err) => {
          console.error('Download request failed', err);
          this.toaster.error('activity.download-error');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((email) => {
        this.toaster.success(this.translate.instant('activity.email-sent', { email }));
      });
  }

  private _extractUsageMetrics(usagePoints: UsagePoint[]): CostTokenStats {
    return {
      aiTokensUsed: usagePoints.length > 0 ? aggregateUsageMetric(usagePoints, 'ai_tokens_used') : null,
      nucliaTokens: usagePoints.length > 0 ? aggregateUsageMetric(usagePoints, 'nuclia_tokens') : null,
      nucliaTokensBilled: usagePoints.length > 0 ? aggregateUsageMetric(usagePoints, 'nuclia_tokens_billed') : null,
    };
  }
}
