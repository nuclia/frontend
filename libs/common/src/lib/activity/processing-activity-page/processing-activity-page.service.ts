import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, Subject, catchError, exhaustMap, forkJoin, map, of, switchMap, take } from 'rxjs';
import { SDKService, UserService } from '@flaps/core';
import {
  ActivityLogFilters,
  ActivityLogItem,
  ActivityLogPagination,
  DownloadFormat,
  EventType,
  UsagePoint,
} from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { TranslateService } from '@ngx-translate/core';
import { NumericCondition } from '../activity-filters';
import { PROCESSING_ACTIVITY_SHOW_FIELDS } from './processing-activity-page.config';

type ProcessingItem = ActivityLogItem & { _displayStatus?: string };

const ALL_SOURCES: EventType[] = [EventType.NEW, EventType.MODIFIED, EventType.PROCESSED];

@Injectable()
export class ProcessingActivityPageService {
  private sdk = inject(SDKService);
  private user = inject(UserService);
  private toaster = inject(SisToastService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  private readonly PAGE_SIZE = 100;

  private _items = signal<ProcessingItem[]>([]);
  private _loading = signal(false);
  private _loadingMore = signal(false);
  private _usageStats = signal<{ resourcesProcessed: number | null; paragraphsProcessed: number | null }>({
    resourcesProcessed: null, paragraphsProcessed: null,
  });
  private _availableMonths = signal<string[]>([]);
  private _yearMonth = signal('');
  private _search = signal<{ term: string; column: string } | null>(null);
  private _lastIds = signal<Record<string, number | undefined>>({});
  private _hasMore = signal(false);

  // Filter state
  private _activeSources = signal<Set<EventType>>(new Set(ALL_SOURCES));
  private _numericConditions = signal<NumericCondition[]>([]);

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly loadingMore = this._loadingMore.asReadonly();
  readonly usageStats = this._usageStats.asReadonly();
  readonly availableMonths = this._availableMonths.asReadonly();
  readonly hasMore = this._hasMore.asReadonly();
  readonly activeSources = this._activeSources.asReadonly();
  readonly numericConditions = this._numericConditions.asReadonly();

  private readonly _sources: Array<[EventType, string]> = [
    [EventType.NEW, 'Ingested'],
    [EventType.MODIFIED, 'Edited'],
    [EventType.PROCESSED, 'Processed'],
  ];

  private readonly _reset$ = new Subject<void>();
  private readonly _nextPage$ = new Subject<void>();
  private readonly _loadUsage$ = new Subject<string>();

  constructor() {
    this._reset$
      .pipe(
        switchMap(() =>
          this._queryPage(false).pipe(
            catchError((err) => {
              console.error('[ProcessingActivityPageService] failed to load data', err);
              this._items.set([]);
              this._loading.set(false);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ next: (groups) => this._applyPage(groups, false) });

    this._nextPage$
      .pipe(
        exhaustMap(() =>
          this._queryPage(true).pipe(
            catchError((err) => {
              console.error('[ProcessingActivityPageService] failed to load next page', err);
              this._loadingMore.set(false);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ next: (groups) => this._applyPage(groups, true) });

    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) =>
          forkJoin([
            kb.activityMonitor.getMonthsWithActivity(EventType.NEW),
            kb.activityMonitor.getMonthsWithActivity(EventType.MODIFIED),
            kb.activityMonitor.getMonthsWithActivity(EventType.PROCESSED),
          ]),
        ),
        map(([a, b, c]) =>
          [...new Set([...a.downloads, ...b.downloads, ...c.downloads])].sort((a, b) =>
            b.localeCompare(a),
          ),
        ),
      )
      .subscribe({
        next: (months) => this._availableMonths.set(months),
        error: () => {},
      });

    this._loadUsage$
      .pipe(
        switchMap((yearMonth) => {
          const { from, to } = this._getMonthRange(yearMonth);
          return forkJoin([this.sdk.currentAccount.pipe(take(1)), this.sdk.currentKb.pipe(take(1))]).pipe(
            switchMap(([account, kb]) => this.sdk.nuclia.db.getUsage(account.id, from, to, kb.id)),
            catchError((err) => {
              console.error('[ProcessingActivityPageService] failed to load usage stats', err);
              return of([] as UsagePoint[]);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((usagePoints) => {
        let resourcesProcessed = 0;
        let paragraphsProcessed = 0;
        for (const point of usagePoints) {
          for (const metric of point.metrics ?? []) {
            if (metric.name === 'resources_processed') resourcesProcessed += metric.value;
            if (metric.name === 'paragraphs_processed') paragraphsProcessed += metric.value;
          }
        }
        this._usageStats.set({
          resourcesProcessed: usagePoints.length > 0 ? resourcesProcessed : null,
          paragraphsProcessed: usagePoints.length > 0 ? paragraphsProcessed : null,
        });
      });
  }

  private _buildFilters(): ActivityLogFilters {
    const filters: ActivityLogFilters = {};
    const search = this._search();
    if (search?.term && search.column !== 'status') {
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

    for (const c of this._numericConditions()) {
      const existing = ((filters as Record<string, unknown>)[c.column] as Record<string, unknown>) ?? {};
      existing[c.operation] = c.value;
      (filters as Record<string, unknown>)[c.column] = existing;
    }

    return filters;
  }

  private _getFilteredSources(): Array<[EventType, string]> {
    const active = this._activeSources();
    return this._sources.filter(([eventType]) => active.has(eventType));
  }

  private _queryPage(isAppend: boolean): Observable<Array<{ eventType: EventType; items: ProcessingItem[] }>> {
    const lastIds = this._lastIds();
    const sources = this._getFilteredSources();
    if (sources.length === 0) {
      return of([]);
    }
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        forkJoin(
          sources.map(([eventType, label]) => {
            const lastId = lastIds[eventType];
            const pagination: ActivityLogPagination =
              isAppend && lastId !== undefined
                ? { limit: this.PAGE_SIZE, starting_after: lastId }
                : { limit: this.PAGE_SIZE };
            return kb.activityMonitor
              .queryActivityLogs(eventType, {
                year_month: this._yearMonth(),
                show: PROCESSING_ACTIVITY_SHOW_FIELDS,
                filters: this._buildFilters(),
                pagination,
              })
              .pipe(
                map((rows) => ({
                  eventType,
                  items: rows.map((item) => ({ ...item, _displayStatus: label })),
                })),
              );
          }),
        ),
      ),
    );
  }

  private _applyPage(groups: Array<{ eventType: EventType; items: ProcessingItem[] }>, isAppend: boolean): void {
    const newLastIds: Record<string, number | undefined> = { ...this._lastIds() };
    groups.forEach(({ eventType, items }) => {
      if (items.length > 0) {
        newLastIds[eventType] = items[items.length - 1].id;
      }
    });
    this._lastIds.set(newLastIds);
    this._hasMore.set(groups.some((g) => g.items.length >= this.PAGE_SIZE));

    const newMerged = groups
      .flatMap((g) => g.items)
      .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
    const combined = isAppend
      ? [...this._items(), ...newMerged].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
      : newMerged;
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
    this._lastIds.set({});
    this._hasMore.set(false);
    this._items.set([]);
    this._usageStats.set({ resourcesProcessed: null, paragraphsProcessed: null });
    this._loading.set(true);
    this._reset$.next();
    this._loadUsage$.next(yearMonth);
  }

  setSearch(term: string, column: string): void {
    this._search.set(term ? { term, column } : null);
    this._lastIds.set({});
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

  updateActiveSources(sources: EventType[]): void {
    if (sources.length === 0) return;
    this._activeSources.set(new Set(sources));
    this._applyFilters();
  }

  updateNumericConditions(conditions: NumericCondition[]): void {
    this._numericConditions.set(conditions);
    this._applyFilters();
  }

  applyAllFilters(activeSources: EventType[], numericConditions: NumericCondition[]): void {
    if (activeSources.length > 0) {
      this._activeSources.set(new Set(activeSources));
    }
    this._numericConditions.set(numericConditions);
    this._applyFilters();
  }

  private _applyFilters(): void {
    if (!this._yearMonth()) return;
    this._lastIds.set({});
    this._hasMore.set(false);
    this._items.set([]);
    this._loading.set(true);
    this._reset$.next();
  }

  download(format: DownloadFormat, columns: string[]): void {
    const sources = this._getFilteredSources();
    const apiShowFields = columns.filter((col) =>
      (PROCESSING_ACTIVITY_SHOW_FIELDS as string[]).includes(col),
    );
    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) =>
          forkJoin(
            sources.map(([eventType]) =>
              kb.activityMonitor.createActivityLogDownload(
                eventType,
                {
                  year_month: this._yearMonth(),
                  filters: this._buildFilters(),
                  notify_via_email: true,
                  show: apiShowFields,
                },
                format,
              ),
            ),
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
}
