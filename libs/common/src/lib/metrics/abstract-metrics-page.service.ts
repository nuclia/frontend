import { DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, Subject, catchError, exhaustMap, switchMap } from 'rxjs';
import { SDKService } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';

/**
 * Abstract base for the metrics page services (CostToken, SearchActivity,
 * ResourceActivity, UsageAnalytics).
 *
 * Subclass contract:
 *   1. Call `this.initPipeline()` inside the subclass constructor
 *      after any subclass-specific initialisation.
 *   2. Call `this.loadAvailableMonths()` once the pipeline is ready.
 *
 * @typeParam T  Item type stored in `_items` (e.g. `ActivityLogItem`).
 * @typeParam R  Raw result type returned by `_queryPage`. Defaults to `T[]`.
 *               Override when the query produces a different shape
 *               (e.g. `ResourceActivityPageService` returns grouped arrays).
 */
export abstract class AbstractMetricsPageService<T, R = T[]> {
  protected sdk = inject(SDKService);
  protected destroyRef = inject(DestroyRef);
  protected translate = inject(TranslateService);

  protected readonly PAGE_SIZE = 100;

  // ── Shared writable state ─────────────────────────────────────────────
  protected _items = signal<T[]>([]);
  protected _loading = signal(false);
  protected _loadingMore = signal(false);
  protected _availableMonths = signal<string[]>([]);
  protected _yearMonth = signal('');
  protected _hasMore = signal(false);

  // ── Public readonly projections ───────────────────────────────────────
  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly loadingMore = this._loadingMore.asReadonly();
  readonly availableMonths = this._availableMonths.asReadonly();
  readonly hasMore = this._hasMore.asReadonly();

  // ── Shared subjects ───────────────────────────────────────────────────
  protected readonly _reset$ = new Subject<void>();
  protected readonly _nextPage$ = new Subject<void>();

  // ── Abstract API ──────────────────────────────────────────────────────
  abstract loadData(yearMonth: string): void;
  protected abstract _queryPage(isAppend: boolean): Observable<R>;
  protected abstract _applyPage(rawResult: R, isAppend: boolean): void;
  protected abstract loadAvailableMonths(): void;

  // ── Concrete shared methods ───────────────────────────────────────────

  loadNextPage(): void {
    if (!this._hasMore() || this._loading() || this._loadingMore()) return;
    this._loadingMore.set(true);
    this._nextPage$.next();
  }

  protected _applyFilters(): void {
    if (!this._yearMonth()) return;
    this._resetPaginationState();
    this._items.set([]);
    this._loading.set(true);
    this._reset$.next();
  }

  /** Override in subclasses to reset pagination cursors beyond `_hasMore`. */
  protected _resetPaginationState(): void {
    this._hasMore.set(false);
  }

  /**
   * Wires `_reset$` / `_nextPage$` into the query → apply pipeline.
   * Must be called once inside each subclass constructor.
   */
  protected initPipeline(): void {
    this._reset$
      .pipe(
        switchMap(() =>
          this._queryPage(false).pipe(
            catchError((err) => {
              console.error(`[${this.constructor.name}] failed to load data`, err);
              this._items.set([]);
              this._loading.set(false);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ next: (result) => this._applyPage(result, false) });

    this._nextPage$
      .pipe(
        exhaustMap(() =>
          this._queryPage(true).pipe(
            catchError((err) => {
              console.error(`[${this.constructor.name}] failed to load next page`, err);
              this._loadingMore.set(false);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ next: (result) => this._applyPage(result, true) });
  }
}
