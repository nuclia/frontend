import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, Subject, catchError, exhaustMap, forkJoin, map, of, switchMap, take } from 'rxjs';
import { SDKService, UserService } from '@flaps/core';
import {
  ActivityLogAskFilters,
  ActivityLogItem,
  ActivityLogPagination,
  DownloadFormat,
  EventType,
  UsagePoint,
} from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { TranslateService } from '@ngx-translate/core';
import { NumericCondition } from '../activity-filters';
import { COST_TOKEN_SHOW_FIELDS } from './cost-token-page.config';

@Injectable()
export class CostTokenPageService {
  private sdk = inject(SDKService);
  private user = inject(UserService);
  private toaster = inject(SisToastService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  private readonly PAGE_SIZE = 100;

  private _items = signal<ActivityLogItem[]>([]);
  private _loading = signal(false);
  private _loadingMore = signal(false);
  private _usageStats = signal<{ aiTokensUsed: number | null; nucliaTokens: number | null; nucliaTokensBilled: number | null }>({
    aiTokensUsed: null, nucliaTokens: null, nucliaTokensBilled: null,
  });
  private _availableMonths = signal<string[]>([]);
  private _yearMonth = signal('');
  private _search = signal<{ term: string; column: string } | null>(null);
  private _lastId = signal<number | undefined>(undefined);
  private _hasMore = signal(false);
  private _booleanFilters = signal<Record<string, boolean | undefined>>({});
  private _numericConditions = signal<NumericCondition[]>([]);

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly loadingMore = this._loadingMore.asReadonly();
  readonly usageStats = this._usageStats.asReadonly();
  readonly availableMonths = this._availableMonths.asReadonly();
  readonly hasMore = this._hasMore.asReadonly();
  readonly booleanFilters = this._booleanFilters.asReadonly();
  readonly numericConditions = this._numericConditions.asReadonly();

  private readonly _reset$ = new Subject<void>();
  private readonly _nextPage$ = new Subject<void>();
  private readonly _loadUsage$ = new Subject<string>();

  constructor() {
    this._reset$
      .pipe(
        switchMap(() =>
          this._queryPage(false).pipe(
            catchError((err) => {
              console.error('[CostTokenPageService] failed to load data', err);
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
          this._queryPage(true).pipe(
            catchError((err) => {
              console.error('[CostTokenPageService] failed to load next page', err);
              this._loadingMore.set(false);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ next: (items) => this._applyPage(items, true) });

    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) => kb.activityMonitor.getMonthsWithActivity(EventType.ASK)),
      )
      .subscribe({
        next: (res) => this._availableMonths.set([...res.downloads].sort((a, b) => b.localeCompare(a))),
        error: () => {},
      });

    this._loadUsage$
      .pipe(
        switchMap((yearMonth) => {
          const { from, to } = this._getMonthRange(yearMonth);
          return forkJoin([this.sdk.currentAccount.pipe(take(1)), this.sdk.currentKb.pipe(take(1))]).pipe(
            switchMap(([account, kb]) => this.sdk.nuclia.db.getUsage(account.id, from, to, kb.id)),
            catchError((err) => {
              console.error('[CostTokenPageService] failed to load usage stats', err);
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

  private _buildFilters(): ActivityLogAskFilters {
    const filters: Record<string, unknown> = {};

    // Search bar filter
    const search = this._search();
    if (search?.term) {
      if (search.column === 'id') {
        const parsed = parseInt(search.term, 10);
        if (!isNaN(parsed)) {
          filters['id'] = { eq: parsed };
        }
      } else if (search.column === 'client_type') {
        (filters as Record<string, unknown>)[search.column] = { eq: search.term };
      } else {
        (filters as Record<string, unknown>)[search.column] = { ilike: search.term };
      }
    }

    // Boolean sidebar filters
    const booleans = this._booleanFilters();
    for (const [key, value] of Object.entries(booleans)) {
      if (value !== undefined) {
        filters[key] = { eq: value };
      }
    }

    // Numeric sidebar filters
    for (const c of this._numericConditions()) {
      const existing = (filters[c.column] as Record<string, unknown>) ?? {};
      // status is ActivityLogFilter<string> in the API — convert numeric values to strings
      existing[c.operation] = c.column === 'status' ? String(c.value) : c.value;
      filters[c.column] = existing;
    }

    return filters as ActivityLogAskFilters;
  }

  private _queryPage(isAppend: boolean): Observable<ActivityLogItem[]> {
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

  private _applyPage(newItems: ActivityLogItem[], isAppend: boolean): void {
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

  loadNextPage(): void {
    if (!this._hasMore() || this._loading() || this._loadingMore()) return;
    this._loadingMore.set(true);
    this._nextPage$.next();
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

  private _applyFilters(): void {
    if (!this._yearMonth()) return;
    this._lastId.set(undefined);
    this._hasMore.set(false);
    this._items.set([]);
    this._loading.set(true);
    this._reset$.next();
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

  private _extractUsageMetrics(usagePoints: UsagePoint[]): {
    aiTokensUsed: number | null;
    nucliaTokens: number | null;
    nucliaTokensBilled: number | null;
  } {
    let aiTokensUsed = 0;
    let nucliaTokens = 0;
    let nucliaTokensBilled = 0;
    for (const point of usagePoints) {
      for (const metric of point.metrics ?? []) {
        if (metric.name === 'ai_tokens_used') aiTokensUsed += metric.value;
        if (metric.name === 'nuclia_tokens') nucliaTokens += metric.value;
        if (metric.name === 'nuclia_tokens_billed') nucliaTokensBilled += metric.value;
      }
    }
    return {
      aiTokensUsed: usagePoints.length > 0 ? aiTokensUsed : null,
      nucliaTokens: usagePoints.length > 0 ? nucliaTokens : null,
      nucliaTokensBilled: usagePoints.length > 0 ? nucliaTokensBilled : null,
    };
  }

  private _getMonthRange(yearMonth: string): { from: string; to: string } {
    const [year, month] = yearMonth.split('-');
    const lastDay = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
    return {
      from: `${yearMonth}-01`,
      to: `${yearMonth}-${String(lastDay).padStart(2, '0')}`,
    };
  }
}
