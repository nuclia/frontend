import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, Subject, catchError, exhaustMap, map, of, switchMap, take } from 'rxjs';
import { SDKService, UserService } from '@flaps/core';
import {
  ActivityLogItem,
  ActivityLogPagination,
  ActivityLogSearchFilters,
  DownloadFormat,
  EventType,
  SearchMetricsItem,
} from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { TranslateService } from '@ngx-translate/core';
import { NumericCondition } from '../activity-filters';
import { SEARCH_ACTIVITY_SHOW_FIELDS } from './search-activity-page.config';

@Injectable()
export class SearchActivityPageService {
  private sdk = inject(SDKService);
  private user = inject(UserService);
  private toaster = inject(SisToastService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  private readonly PAGE_SIZE = 100;

  private _items = signal<ActivityLogItem[]>([]);
  private _loading = signal(false);
  private _loadingMore = signal(false);

  private _availableMonths = signal<string[]>([]);
  private _yearMonth = signal('');
  private _search = signal<{ term: string; column: string } | null>(null);
  private _lastId = signal<number | undefined>(undefined);
  private _hasMore = signal(false);
  private _searchTotals = signal<{ totalSearch: number | null; totalChat: number | null }>({
    totalSearch: null,
    totalChat: null,
  });

  // Sidebar numeric filter state
  private _numericConditions = signal<NumericCondition[]>([]);

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly loadingMore = this._loadingMore.asReadonly();
  readonly availableMonths = this._availableMonths.asReadonly();
  readonly hasMore = this._hasMore.asReadonly();
  readonly searchTotals = this._searchTotals.asReadonly();
  readonly numericConditions = this._numericConditions.asReadonly();

  private readonly _reset$ = new Subject<void>();
  private readonly _nextPage$ = new Subject<void>();
  private readonly _loadTotals$ = new Subject<string>();

  constructor() {
    this._reset$
      .pipe(
        switchMap(() =>
          this._queryPage(false).pipe(
            catchError((err) => {
              console.error('[SearchActivityPageService] failed to load data', err);
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
              console.error('[SearchActivityPageService] failed to load next page', err);
              this._loadingMore.set(false);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ next: (items) => this._applyPage(items, true) });

    this._loadTotals$
      .pipe(
        switchMap((yearMonth) => {
          const { from, to } = this._getMonthRange(yearMonth);
          return this.sdk.currentKb.pipe(
            take(1),
            switchMap((kb) => kb.activityMonitor.getSearchMetrics(from, to)),
            catchError((err) => {
              console.error('[SearchActivityPageService] failed to load search totals', err);
              return of([] as SearchMetricsItem[]);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((items) => {
        this._searchTotals.set(this._computeSearchTotals(items));
      });

    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) => kb.activityMonitor.getMonthsWithActivity(EventType.SEARCH)),
      )
      .subscribe({
        next: (res) => this._availableMonths.set([...res.downloads].sort((a, b) => b.localeCompare(a))),
        error: () => {},
      });
  }

  private _buildFilters(): ActivityLogSearchFilters {
    const filters: ActivityLogSearchFilters = {};

    // Text search
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

    // Numeric filters
    for (const c of this._numericConditions()) {
      const existing = ((filters as Record<string, unknown>)[c.column] as Record<string, unknown>) ?? {};
      existing[c.operation] = c.value;
      (filters as Record<string, unknown>)[c.column] = existing;
    }

    return filters;
  }

  private _queryPage(isAppend: boolean): Observable<ActivityLogItem[]> {
    const pagination: ActivityLogPagination =
      isAppend && this._lastId() !== undefined
        ? { limit: this.PAGE_SIZE, starting_after: this._lastId() }
        : { limit: this.PAGE_SIZE };
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        kb.activityMonitor.queryActivityLogs(EventType.SEARCH, {
          year_month: this._yearMonth(),
          show: SEARCH_ACTIVITY_SHOW_FIELDS,
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
    this._loading.set(true);
    this._searchTotals.set({ totalSearch: null, totalChat: null });
    this._reset$.next();
    this._loadTotals$.next(yearMonth);
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

  updateNumericConditions(conditions: NumericCondition[]): void {
    this._numericConditions.set(conditions);
    this._applyFilters();
  }

  applyAllFilters(numericConditions: NumericCondition[]): void {
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
            EventType.SEARCH,
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

  private _getMonthRange(yearMonth: string): { from: string; to: string } {
    const [year, month] = yearMonth.split('-');
    const lastDay = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
    return {
      from: `${yearMonth}-01`,
      to: `${yearMonth}-${String(lastDay).padStart(2, '0')}`,
    };
  }

  private _computeSearchTotals(items: SearchMetricsItem[]): {
    totalSearch: number | null;
    totalChat: number | null;
  } {
    if (items.length === 0) {
      return { totalSearch: null, totalChat: null };
    }
    return {
      totalSearch: items.reduce((sum, item) => sum + item.search, 0),
      totalChat: items.reduce((sum, item) => sum + item.chat, 0),
    };
  }
}
