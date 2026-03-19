import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, exhaustMap, map, switchMap, take } from 'rxjs';
import { SDKService } from '@flaps/core';
import { EventType, RemiAnswerStatus, RemiQueryCriteria, RemiQueryResponse } from '@nuclia/core';

export interface RemiAnalyticsItem {
  id: number;
  question: string;
  answer: string | null;
  remiScore: number | null;
}

@Injectable()
export class RemiAnalyticsPageService {
  private sdk = inject(SDKService);
  private destroyRef = inject(DestroyRef);

  private readonly PAGE_SIZE = 100;

  private _items = signal<RemiAnalyticsItem[]>([]);
  private _loading = signal(false);
  private _loadingMore = signal(false);
  private _hasMore = signal(false);
  private _yearMonth = signal('');
  private _status = signal<RemiAnswerStatus>('SUCCESS');
  private _lastId = signal<number | undefined>(undefined);
  private _availableMonths = signal<string[]>([]);

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly loadingMore = this._loadingMore.asReadonly();
  readonly hasMore = this._hasMore.asReadonly();
  readonly availableMonths = this._availableMonths.asReadonly();
  readonly activeStatus = this._status.asReadonly();

  private readonly _reset$ = new Subject<void>();
  private readonly _nextPage$ = new Subject<void>();

  constructor() {
    this._reset$
      .pipe(
        switchMap(() => {
          this._loading.set(true);
          return this._queryPage(false).pipe(
            catchError((err) => {
              console.error('[RemiAnalyticsPageService] failed to load data', err);
              this._items.set([]);
              this._loading.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => {
          this._items.set(result.items);
          this._hasMore.set(result.hasMore);
          this._lastId.set(result.lastId);
          this._loading.set(false);
        },
      });

    this._nextPage$
      .pipe(
        exhaustMap(() => {
          this._loadingMore.set(true);
          return this._queryPage(true).pipe(
            catchError((err) => {
              console.error('[RemiAnalyticsPageService] failed to load next page', err);
              this._loadingMore.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => {
          this._items.update((prev) => [...prev, ...result.items]);
          this._hasMore.set(result.hasMore);
          this._lastId.set(result.lastId);
          this._loadingMore.set(false);
        },
      });

    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) => kb.activityMonitor.getMonthsWithActivity(EventType.ASK)),
        map((res) => [...res.downloads].sort((a, b) => b.localeCompare(a))),
      )
      .subscribe({
        next: (months) => this._availableMonths.set(months),
        error: () => {},
      });
  }

  loadData(yearMonth: string, status: RemiAnswerStatus = 'SUCCESS'): void {
    this._yearMonth.set(yearMonth);
    this._status.set(status);
    this._lastId.set(undefined);
    this._reset$.next();
  }

  setStatus(status: RemiAnswerStatus): void {
    this._status.set(status);
    this._lastId.set(undefined);
    this._reset$.next();
  }

  loadNextPage(): void {
    if (!this._hasMore() || this._loading() || this._loadingMore()) return;
    this._nextPage$.next();
  }

  private _queryPage(isAppend: boolean) {
    const lastId = this._lastId();
    const criteria: RemiQueryCriteria = {
      month: this._yearMonth(),
      status: this._status(),
      pagination:
        isAppend && lastId !== undefined
          ? { limit: this.PAGE_SIZE, starting_after: lastId }
          : { limit: this.PAGE_SIZE },
    };
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.activityMonitor.queryRemiScores(criteria)),
      map((response: RemiQueryResponse) => {
        const items: RemiAnalyticsItem[] = response.data.map((item) => ({
          id: item.id,
          question: item.question,
          answer: item.answer ?? null,
          remiScore: item.remi?.answer_relevance?.score ?? null,
        }));
        const lastId = items.length > 0 ? items[items.length - 1].id : undefined;
        return { items, hasMore: response.has_more, lastId };
      }),
    );
  }
}
