import { Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, Subject, catchError, forkJoin, map, of, switchMap, take } from 'rxjs';
import { UserService } from '@flaps/core';
import {
  ActivityLogFilters,
  ActivityLogPagination,
  DownloadFormat,
  EventType,
  UsagePoint,
} from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { NumericCondition, DateCondition } from '../metrics-filters';
import { ProcessingItem, ProcessingStats } from '../metrics-column.model';
import { aggregateUsageMetric, applyNumericConditions, applyDateConditions, applyTextSearchFilter, getMonthRange } from '../metrics-utils';
import { PROCESSING_ACTIVITY_SHOW_FIELDS } from './resource-activity-page.config';
import { AbstractMetricsPageService } from '../abstract-metrics-page.service';

const ALL_SOURCES: EventType[] = [EventType.NEW, EventType.MODIFIED, EventType.PROCESSED];

interface ResourceActivityGroup {
  eventType: EventType;
  items: ProcessingItem[];
}

@Injectable()
export class ResourceActivityPageService extends AbstractMetricsPageService<ProcessingItem, ResourceActivityGroup[]> {
  private user = inject(UserService);
  private toaster = inject(SisToastService);

  private _usageStats = signal<ProcessingStats>({
    resourcesProcessed: null, paragraphsProcessed: null,
  });
  private _search = signal<{ term: string; column: string } | null>(null);
  private _lastIds = signal<Record<string, number | undefined>>({});

  // Filter state
  private _activeSources = signal<Set<EventType>>(new Set(ALL_SOURCES));
  private _numericConditions = signal<NumericCondition[]>([]);
  private _dateConditions = signal<DateCondition[]>([]);

  readonly usageStats = this._usageStats.asReadonly();
  readonly activeSources = this._activeSources.asReadonly();
  readonly numericConditions = this._numericConditions.asReadonly();
  readonly dateConditions = this._dateConditions.asReadonly();

  private readonly _sources: Array<[EventType, string]> = [
    [EventType.NEW, 'Ingested'],
    [EventType.MODIFIED, 'Edited'],
    [EventType.PROCESSED, 'Processed'],
  ];

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
              console.error('[ResourceActivityPageService] failed to load usage stats', err);
              return of([] as UsagePoint[]);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((usagePoints) => {
        this._usageStats.set({
          resourcesProcessed: usagePoints.length > 0 ? aggregateUsageMetric(usagePoints, 'resources_processed') : null,
          paragraphsProcessed: usagePoints.length > 0 ? aggregateUsageMetric(usagePoints, 'paragraphs_processed') : null,
        });
      });
  }

  protected loadAvailableMonths(): void {
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
  }

  protected override _resetPaginationState(): void {
    super._resetPaginationState();
    this._lastIds.set({});
  }

  private _buildFilters(): ActivityLogFilters {
    const filters: Record<string, unknown> = {};
    const search = this._search();
    if (search?.column !== 'status') {
      applyTextSearchFilter(search, filters);
    }

    applyNumericConditions(this._numericConditions(), filters);

    // Date filters
    applyDateConditions(this._dateConditions(), filters);

    return filters as ActivityLogFilters;
  }

  private _getFilteredSources(): Array<[EventType, string]> {
    const active = this._activeSources();
    return this._sources.filter(([eventType]) => active.has(eventType));
  }

  protected _queryPage(isAppend: boolean): Observable<ResourceActivityGroup[]> {
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

  protected _applyPage(groups: ResourceActivityGroup[], isAppend: boolean): void {
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
      .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));
    const combined = isAppend
      ? [...this._items(), ...newMerged]
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

  updateActiveSources(sources: EventType[]): void {
    if (sources.length === 0) return;
    this._activeSources.set(new Set(sources));
    this._applyFilters();
  }

  updateNumericConditions(conditions: NumericCondition[]): void {
    this._numericConditions.set(conditions);
    this._applyFilters();
  }

  updateDateFilter(conditions: DateCondition[]): void {
    this._dateConditions.set(conditions);
    this._applyFilters();
  }

  applyAllFilters(activeSources: EventType[], numericConditions: NumericCondition[], dateConditions: DateCondition[] = []): void {
    if (activeSources.length > 0) {
      this._activeSources.set(new Set(activeSources));
    }
    this._numericConditions.set(numericConditions);
    this._dateConditions.set(dateConditions);
    this._applyFilters();
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
}
