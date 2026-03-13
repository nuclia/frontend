import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, switchMap, take } from 'rxjs';
import { SDKService } from '@flaps/core';
import { ActivityLogItem, EventType } from '@nuclia/core';
import { SEARCH_ACTIVITY_SHOW_FIELDS } from './search-activity-page.config';

@Injectable()
export class SearchActivityPageService {
  private sdk = inject(SDKService);
  private destroyRef = inject(DestroyRef);

  private _items = signal<ActivityLogItem[]>([]);
  private _loading = signal(false);
  private _stats = signal({
    totalQueries: 0,
    avgRetrievalTimeMs: 0,
    avgResourcesReturned: 0,
    emptyResults: 0,
  });
  private _availableMonths = signal<string[]>([]);

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly stats = this._stats.asReadonly();
  readonly availableMonths = this._availableMonths.asReadonly();

  private readonly _loadTrigger$ = new Subject<string>();

  constructor() {
    this._loadTrigger$
      .pipe(
        switchMap((yearMonth) =>
          this.sdk.currentKb.pipe(
            take(1),
            switchMap((kb) =>
              kb.activityMonitor.queryActivityLogs(EventType.SEARCH, {
                year_month: yearMonth,
                show: SEARCH_ACTIVITY_SHOW_FIELDS,
                filters: {},
              }),
            ),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (rows) => {
          const items = rows;
          this._items.set(items);
          const withRetrieval = items.filter((i) => i.retrieval_time !== null);
          const retrievalSum = withRetrieval.reduce((sum, i) => sum + i.retrieval_time!, 0);
          const avgRetrievalTimeMs = withRetrieval.length > 0 ? Math.round(retrievalSum / withRetrieval.length) : 0;

          const withResources = items.filter((i) => i.resources_count !== null);
          const resourcesSum = withResources.reduce((sum, i) => sum + i.resources_count!, 0);
          const avgResourcesReturned = withResources.length > 0 ? Math.round(resourcesSum / withResources.length) : 0;

          const emptyResults = items.filter((i) => (i.resources_count ?? 0) === 0).length;

          this._stats.set({
            totalQueries: items.length,
            avgRetrievalTimeMs,
            avgResourcesReturned,
            emptyResults,
          });
          this._loading.set(false);
        },
        error: (err) => {
          console.error('[SearchActivityPageService] failed to load data', err);
          this._items.set([]);
          this._loading.set(false);
        },
      });

    this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.activityMonitor.getMonthsWithActivity(EventType.SEARCH)),
    ).subscribe({
      next: (res) => this._availableMonths.set([...res.downloads].sort((a, b) => b.localeCompare(a))),
      error: () => {},
    });
  }

  loadData(yearMonth: string): void {
    if (!yearMonth) return;
    this._loading.set(true);
    this._loadTrigger$.next(yearMonth);
  }
}
