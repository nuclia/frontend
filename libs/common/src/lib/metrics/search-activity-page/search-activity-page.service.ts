import { Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, Subject, catchError, map, of, switchMap, take } from 'rxjs';
import { UserService } from '@flaps/core';
import {
  ActivityLogItem,
  ActivityLogPagination,
  ActivityLogSearchFilters,
  DownloadFormat,
  EventType,
  SearchMetricsItem,
} from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { NumericCondition, DateCondition } from '../metrics-filters';
import { applyNumericConditions, applyDateConditions, applyTextSearchFilter, getMonthRange } from '../metrics-utils';
import { SEARCH_ACTIVITY_SHOW_FIELDS } from './search-activity-page.config';
import { AbstractMetricsPageService } from '../abstract-metrics-page.service';

@Injectable()
export class SearchActivityPageService extends AbstractMetricsPageService<ActivityLogItem> {
  private user = inject(UserService);
  private toaster = inject(SisToastService);

  private _search = signal<{ term: string; column: string } | null>(null);
  private _lastId = signal<number | undefined>(undefined);
  private _searchTotals = signal<{ totalSearch: number | null; totalChat: number | null }>({
    totalSearch: null,
    totalChat: null,
  });

  // Sidebar numeric filter state
  private _numericConditions = signal<NumericCondition[]>([]);
  private _dateConditions = signal<DateCondition[]>([]);

  readonly searchTotals = this._searchTotals.asReadonly();
  readonly numericConditions = this._numericConditions.asReadonly();
  readonly dateConditions = this._dateConditions.asReadonly();

  private readonly _loadTotals$ = new Subject<string>();

  constructor() {
    super();
    this.initPipeline();
    this.loadAvailableMonths();

    this._loadTotals$
      .pipe(
        switchMap((yearMonth) => {
          const { from, to } = getMonthRange(yearMonth);
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
  }

  protected loadAvailableMonths(): void {
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

  protected override _resetPaginationState(): void {
    super._resetPaginationState();
    this._lastId.set(undefined);
  }

  private _buildFilters(): ActivityLogSearchFilters {
    const filters: Record<string, unknown> = {};

    // Text search
    applyTextSearchFilter(this._search(), filters);

    // Numeric filters
    applyNumericConditions(this._numericConditions(), filters);

    // Date filters
    applyDateConditions(this._dateConditions(), filters);

    return filters as ActivityLogSearchFilters;
  }

  protected _queryPage(isAppend: boolean): Observable<ActivityLogItem[]> {
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

  updateNumericConditions(conditions: NumericCondition[]): void {
    this._numericConditions.set(conditions);
    this._applyFilters();
  }

  updateDateFilter(conditions: DateCondition[]): void {
    this._dateConditions.set(conditions);
    this._applyFilters();
  }

  applyAllFilters(numericConditions: NumericCondition[], dateConditions: DateCondition[] = []): void {
    this._numericConditions.set(numericConditions);
    this._dateConditions.set(dateConditions);
    this._applyFilters();
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
