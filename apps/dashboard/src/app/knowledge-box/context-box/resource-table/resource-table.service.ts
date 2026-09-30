import { computed, inject, Injectable, signal } from '@angular/core';
import { SDKService } from '@flaps/core';
import {
  CatalogOptions,
  FileUploadStatus,
  IErrorResponse,
  IResource,
  RESOURCE_STATUS,
  Search,
  SortField,
} from '@nuclia/core';
import { finalize, map, Observable, of, shareReplay, switchMap, take, tap } from 'rxjs';
import { DEFAULT_PAGE_SIZE, EXCLUDE_HISTORY_FILTER, ContextBoxService } from '../context-box/context-box.service';

// Limit for the processing-status lookup used to overlay queue rank onto pending resources;
// unrelated to the table's display page size.
const PROCESSING_STATUS_LIMIT = 200;

type RankedResource = IResource & { rank?: number };

// Scoped to ResourceTableComponent: a fresh instance is created every time the resources
// modal opens, so pagination/query state naturally resets. The underlying `resources` fetch
// is still triggered off `ContextBoxService.refreshResources`, since uploads and KB-wide
// notifications (shared with `resourceCounter`) must also be able to trigger a refresh.
@Injectable()
export class ResourceTableService {
  private sdk = inject(SDKService);
  private contextBoxService = inject(ContextBoxService);

  private _page = signal(0);
  page = this._page.asReadonly();
  private _pageSize = signal(DEFAULT_PAGE_SIZE);
  pageSize = this._pageSize.asReadonly();
  private _query = signal('');
  query = this._query.asReadonly();
  private _totalItems = signal(0);
  totalItems = this._totalItems.asReadonly();
  totalPages = computed(() => Math.ceil(this._totalItems() / this._pageSize()));

  private _loading = signal(true);
  loading = this._loading.asReadonly();

  resources: Observable<RankedResource[]> = this.contextBoxService.refreshResources.pipe(
    tap(() => this._loading.set(true)),
    switchMap(() =>
      this.catalog().pipe(
        map((res) => (res.type === 'error' ? [] : Object.values(res.resources || {}))),
        switchMap((resources) => {
          if (resources.some((resource) => resource.metadata?.status === RESOURCE_STATUS.PENDING)) {
            return this.getResourcesWithRank(resources);
          } else {
            return of(resources);
          }
        }),
        // finalize (not tap) so the loading flag resets even on error/cancellation, and
        // it must live inside switchMap's projection so it fires per-request rather than
        // only once when the whole long-lived stream is finally unsubscribed.
        finalize(() => this._loading.set(false)),
      ),
    ),
    shareReplay({ refCount: true, bufferSize: 1 }),
  );

  loadPage(page: number) {
    this._page.set(page);
    this.contextBoxService.forceRefresh();
  }

  setPageSize(pageSize: number) {
    this._page.set(0);
    this._pageSize.set(pageSize);
    this.contextBoxService.forceRefresh();
  }

  onQueryChange(query: string) {
    this._query.set(query);
    // Reset immediately when the field is cleared, without forcing the user to hit Enter.
    if (!query) {
      this.search();
    }
  }

  search() {
    this._page.set(0);
    this.contextBoxService.forceRefresh();
  }

  isUploadFailed(upload: FileUploadStatus): boolean {
    return upload.failed || !!upload.blocked || !!upload.conflicts || !!upload.limitExceeded;
  }

  private getResourcesWithRank(resources: IResource[]): Observable<RankedResource[]> {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.processingStatus(undefined, undefined, PROCESSING_STATUS_LIMIT)),
      map((processingStatus) =>
        processingStatus.results
          .filter((status) => status.schedule_order !== -1)
          .reduce((resources, status) => {
            const index = resources.findIndex((resource) => resource.id === status.resource_id);
            if (index > -1) {
              resources[index] = { ...resources[index], rank: status.schedule_order };
            }
            return resources;
          }, resources as RankedResource[])
          .sort((a, b) => (a.rank && b.rank ? a.rank - b.rank : 0)),
      ),
    );
  }

  private catalog(): Observable<Search.Results | IErrorResponse> {
    const options: CatalogOptions = {
      page_number: this._page(),
      page_size: this._pageSize(),
      filter_expression: EXCLUDE_HISTORY_FILTER,
      sort: { field: SortField.created, order: 'desc' },
    };
    return this.sdk.currentKb.pipe(
      // `take(1)` is required so this observable actually completes once the catalog call
      // resolves; without it `currentKb` never completes and the `finalize()` above never fires.
      take(1),
      switchMap((kb) => kb.catalog(this._query(), options)),
      tap((result) => {
        if (result.type === 'searchResults') {
          this._totalItems.set(result.fulltext?.total || 0);
        }
      }),
    );
  }
}
