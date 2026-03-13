import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, forkJoin, map, switchMap, take } from 'rxjs';
import { SDKService } from '@flaps/core';
import { ActivityLogItem, EventType } from '@nuclia/core';
import { PROCESSING_ACTIVITY_SHOW_FIELDS } from './processing-activity-page.config';

type ProcessingItem = ActivityLogItem & { _displayStatus?: string };

@Injectable()
export class ProcessingActivityPageService {
  private sdk = inject(SDKService);
  private destroyRef = inject(DestroyRef);

  private _items = signal<ProcessingItem[]>([]);
  private _loading = signal(false);
  private _stats = signal({ resourcesIngested: 0, resourcesProcessed: 0, resourcesEdited: 0 });
  private _activeStatusFilter = signal('');
  private _availableMonths = signal<string[]>([]);

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly stats = this._stats.asReadonly();
  readonly activeStatusFilter = this._activeStatusFilter.asReadonly();
  readonly availableMonths = this._availableMonths.asReadonly();

  private readonly _sources: Array<[EventType, string]> = [
    [EventType.NEW, 'Ingested'],
    [EventType.MODIFIED, 'Edited'],
    [EventType.PROCESSED, 'Processed'],
  ];

  private readonly _loadTrigger$ = new Subject<string>();

  constructor() {
    this._loadTrigger$
      .pipe(
        switchMap((yearMonth) => {
          const query = { year_month: yearMonth, show: PROCESSING_ACTIVITY_SHOW_FIELDS, filters: {} };
          return this.sdk.currentKb.pipe(
            take(1),
            switchMap((kb) =>
              forkJoin(
                this._sources.map(([eventType, label]) =>
                  kb.activityMonitor
                    .queryActivityLogs(eventType, query)
                    .pipe(map((rows) => rows.map((item) => ({ ...item, _displayStatus: label })))),
                ),
              ),
            ),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (groups) => {
          this._items.set(
            groups.flat().sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')),
          );
          const [ingested, edited, processed] = groups;
          this._stats.set({
            resourcesIngested: ingested.length,
            resourcesProcessed: processed.length,
            resourcesEdited: edited.length,
          });
          this._loading.set(false);
        },
        error: (err) => {
          console.error('[ProcessingActivityPageService] failed to load data', err);
          this._items.set([]);
          this._loading.set(false);
        },
      });

    this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        forkJoin([
          kb.activityMonitor.getMonthsWithActivity(EventType.NEW),
          kb.activityMonitor.getMonthsWithActivity(EventType.MODIFIED),
          kb.activityMonitor.getMonthsWithActivity(EventType.PROCESSED),
        ]),
      ),
      map(([a, b, c]) => [...new Set([...a.downloads, ...b.downloads, ...c.downloads])].sort((a, b) => b.localeCompare(a))),
    ).subscribe({
      next: (months) => this._availableMonths.set(months),
      error: () => {},
    });
  }

  loadData(yearMonth: string): void {
    if (!yearMonth) return;
    this._loading.set(true);
    this._loadTrigger$.next(yearMonth);
  }

  filterByStatus(status: string): void {
    this._activeStatusFilter.set(status);
  }

  clearStatusFilter(): void {
    this._activeStatusFilter.set('');
  }
}
