import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, catchError, map, switchMap, take } from 'rxjs';
import { UserService } from '@flaps/core';
import {
  ActivityLogAskFilters,
  ActivityLogAskShowFields,
  ActivityLogItem,
  ActivityLogPagination,
  DownloadFormat,
  EventType,
} from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { BooleanCondition, DateCondition } from '../metrics-filters';
import {
  applyBooleanConditions,
  applyDateConditions,
  applyTextSearchFilter,
  getMonthsSinceDate,
} from '../metrics-utils';
import { USER_FEEDBACK_DOWNLOAD_SHOW_FIELDS, USER_FEEDBACK_SHOW_FIELDS } from './user-feedback-page.config';
import { AbstractMetricsPageService } from '../abstract-metrics-page.service';

@Injectable()
export class UserFeedbackPageService extends AbstractMetricsPageService<ActivityLogItem> {
  private user = inject(UserService);
  private toaster = inject(SisToastService);

  private _search = signal<{ term: string; column: string } | null>(null);
  private _lastId = signal<number | undefined>(undefined);
  private _booleanConditions = signal<BooleanCondition[]>([]);
  private _dateConditions = signal<DateCondition[]>([]);

  readonly booleanConditions = this._booleanConditions.asReadonly();
  readonly dateConditions = this._dateConditions.asReadonly();
  readonly hasActiveFilters = computed(() => this._booleanConditions().length > 0 || this._dateConditions().length > 0);

  constructor() {
    super();
    this.initPipeline();
    this.loadAvailableMonths();
  }

  protected loadAvailableMonths(): void {
    this.sdk.currentAccount.pipe(take(1)).subscribe((account) => {
      const creationDate = new Date(account.creation_date + 'Z');
      this._availableMonths.set(getMonthsSinceDate(creationDate));
    });
  }

  protected override _resetPaginationState(): void {
    super._resetPaginationState();
    this._lastId.set(undefined);
  }

  private _buildFilters(): ActivityLogAskFilters {
    const filters: Record<string, unknown> = {};
    applyTextSearchFilter(this._search(), filters);
    applyBooleanConditions(this._booleanConditions(), filters);
    applyDateConditions(this._dateConditions(), filters);
    return filters as ActivityLogAskFilters;
  }

  protected _queryPage(isAppend: boolean): Observable<ActivityLogItem[]> {
    const pagination: ActivityLogPagination =
      isAppend && this._lastId() !== undefined
        ? { limit: this.PAGE_SIZE, starting_after: this._lastId() }
        : { limit: this.PAGE_SIZE };
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        kb.activityMonitor.queryActivityLogs(EventType.ASK, {
          year_month: this._yearMonth(),
          show: [...USER_FEEDBACK_SHOW_FIELDS] as ActivityLogAskShowFields[],
          filters: this._buildFilters(),
          pagination,
        }),
      ),
    );
  }

  protected _applyPage(newItems: ActivityLogItem[], isAppend: boolean): void {
    const lastId = newItems.at(-1)?.id;
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

  resetFilters(): void {
    this.applyAllFilters([], []);
  }

  applyAllFilters(booleanConditions: BooleanCondition[], dateConditions: DateCondition[] = []): void {
    this._booleanConditions.set(booleanConditions);
    this._dateConditions.set(dateConditions);
    this._applyFilters();
  }

  download(format: DownloadFormat): void {
    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) =>
          kb.activityMonitor.createActivityLogDownload(
            EventType.ASK,
            {
              year_month: this._yearMonth(),
              notify_via_email: true,
              filters: {},
              show: [...USER_FEEDBACK_DOWNLOAD_SHOW_FIELDS] as ActivityLogAskShowFields[],
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
