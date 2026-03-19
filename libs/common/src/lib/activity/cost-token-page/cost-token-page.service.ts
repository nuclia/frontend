import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, Subject, catchError, exhaustMap, map, switchMap, take } from 'rxjs';
import { SDKService, UserService } from '@flaps/core';
import {
  ActivityLogAskFilters,
  ActivityLogItem,
  ActivityLogPagination,
  DownloadFormat,
  EventType,
} from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { TranslateService } from '@ngx-translate/core';
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
  private _stats = signal({ totalTokens: 0 });
  private _availableMonths = signal<string[]>([]);
  private _yearMonth = signal('');
  private _search = signal<{ term: string; column: string } | null>(null);
  private _lastId = signal<number | undefined>(undefined);
  private _hasMore = signal(false);

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly loadingMore = this._loadingMore.asReadonly();
  readonly stats = this._stats.asReadonly();
  readonly availableMonths = this._availableMonths.asReadonly();
  readonly hasMore = this._hasMore.asReadonly();

  private readonly _reset$ = new Subject<void>();
  private readonly _nextPage$ = new Subject<void>();

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
  }

  private _buildFilters(): ActivityLogAskFilters {
    const search = this._search();
    if (!search?.term) return {};
    return { [search.column]: { ilike: search.term } } as ActivityLogAskFilters;
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
    const totalTokens = combined.reduce((sum, i) => sum + (i.nuclia_tokens ?? 0), 0);
    this._stats.set({ totalTokens });
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
    this._reset$.next();
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
}
