import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, switchMap, take } from 'rxjs';
import { SDKService } from '@flaps/core';
import { ActivityLogItem, EventType } from '@nuclia/core';
import { COST_TOKEN_SHOW_FIELDS } from './cost-token-page.config';

@Injectable()
export class CostTokenPageService {
  private sdk = inject(SDKService);
  private destroyRef = inject(DestroyRef);

  private _items = signal<ActivityLogItem[]>([]);
  private _loading = signal(false);
  private _stats = signal({ totalTokens: 0, avgTokensPerQuery: 0 });
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
              kb.activityMonitor.queryActivityLogs(EventType.ASK, {
                year_month: yearMonth,
                show: COST_TOKEN_SHOW_FIELDS,
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
          const totalTokens = items.reduce((sum, i) => sum + (i.nuclia_tokens ?? 0), 0);
          const avgTokensPerQuery = items.length > 0 ? Math.round(totalTokens / items.length) : 0;
          this._stats.set({ totalTokens, avgTokensPerQuery });
          this._loading.set(false);
        },
        error: (err) => {
          console.error('[CostTokenPageService] failed to load data', err);
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
}
