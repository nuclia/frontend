import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, forkJoin, switchMap, take, catchError, of } from 'rxjs';
import { SDKService } from '@flaps/core';
import { ActivityLogItem, EventType, RemiScoresResponseItem } from '@nuclia/core';
import { USAGE_ANALYSIS_SHOW_FIELDS } from './usage-analysis-page.config';

@Injectable()
export class UsageAnalysisPageService {
  private sdk = inject(SDKService);
  private destroyRef = inject(DestroyRef);

  private _items = signal<ActivityLogItem[]>([]);
  private _loading = signal(false);
  private _stats = signal({
    totalQueries: 0,
    avgRemiScore: 0,
    topFilterUsed: '',
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
              forkJoin([
                kb.activityMonitor.queryActivityLogs(EventType.ASK, {
                  year_month: yearMonth,
                  show: USAGE_ANALYSIS_SHOW_FIELDS,
                  filters: {},
                }),
                kb.activityMonitor.getRemiScores(`${yearMonth}-01`, `${yearMonth}-31`).pipe(
                  catchError(() => of([])),
                ),
              ]),
            ),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ([rows, remiItems]: [ActivityLogItem[], RemiScoresResponseItem[]]) => {
          this._items.set(rows);
          const allAverages = remiItems.flatMap((r) => r.metrics.map((m) => m.average));
          const avgRemiScore = allAverages.length > 0
            ? parseFloat((allAverages.reduce((a, b) => a + b, 0) / allAverages.length).toFixed(1))
            : 0;
          this._stats.set({
            totalQueries: rows.length,
            avgRemiScore,
            topFilterUsed: this.topStrategyName(rows),
          });
          this._loading.set(false);
        },
        error: (err) => {
          console.error('[UsageAnalysisPageService] failed to load data', err);
          this._items.set([]);
          this._loading.set(false);
        },
      });

    this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.activityMonitor.getMonthsWithActivity(EventType.ASK)),
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

  private topStrategyName(items: ActivityLogItem[]): string {
    const counts = new Map<string, number>();
    for (const item of items) {
      for (const name of item.rag_strategies_names ?? []) {
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
    }
    let top = '';
    let max = 0;
    for (const [name, count] of counts) {
      if (count > max) {
        max = count;
        top = name;
      }
    }
    return top;
  }
}
