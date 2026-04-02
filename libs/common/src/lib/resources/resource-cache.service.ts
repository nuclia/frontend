import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SDKService } from '@flaps/core';
import { Search } from '@nuclia/core';
import {
  BehaviorSubject,
  catchError,
  distinctUntilKeyChanged,
  filter,
  merge,
  of,
  skip,
  Subject,
  switchMap,
  take,
  tap,
  timer,
} from 'rxjs';
import { UploadService } from '../upload/upload.service';

@Injectable({
  providedIn: 'root',
})
export class ResourceCacheService {
  private sdk = inject(SDKService);
  private uploadService = inject(UploadService);

  private _facetsCache = new BehaviorSubject<Search.FacetsResult | null>(null);
  facets$ = this._facetsCache.asObservable();

  private _fetchTrigger = new Subject<string[]>();
  private _fetchInFlight = false;

  constructor() {
    // Internal fetch pipeline — switchMap deduplicates concurrent misses
    this._fetchTrigger
      .pipe(
        switchMap((facetList) =>
          this.sdk.currentKb.pipe(
            take(1),
            switchMap((kb) =>
              kb.getFacets(facetList).pipe(
                catchError(() => of(null as Search.FacetsResult | null)), // catchError INSIDE switchMap — keeps outer stream alive
              ),
            ),
          ),
        ),
        tap((result) => {
          this._fetchInFlight = false;
          this._facetsCache.next(result ?? ({} as Search.FacetsResult));
        }),
        takeUntilDestroyed(),
      )
      .subscribe();

    // Invalidation stream — mutations and KB switches
    const mutationInvalidation$ = this.uploadService.refreshNeeded;

    const kbChange$ = this.sdk.currentKb.pipe(
      distinctUntilKeyChanged('id'),
      skip(1), // skip initial emission at service construction
    );

    merge(mutationInvalidation$, kbChange$)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this._fetchInFlight = false;
        this._facetsCache.next(null);
      });

    // TTL — 60-minute safety net for external mutations
    // switchMap cancels the previous timer if the cache is re-filled before TTL expires
    this._facetsCache
      .pipe(
        filter((v) => v !== null),
        switchMap(() => timer(60 * 60 * 1000)),
        takeUntilDestroyed(),
      )
      .subscribe(() => this._facetsCache.next(null));
  }

  /**
   * Returns cached facets immediately on a cache hit.
   * On a cache miss, triggers a fetch and returns the first non-null emission.
   */
  requestFacets(facetList: string[]) {
    if (this._facetsCache.value !== null) {
      return of(this._facetsCache.value);
    }

    if (!this._fetchInFlight) {
      this._fetchInFlight = true;
      this._fetchTrigger.next(facetList);
    }
    return this._facetsCache.pipe(
      filter((v): v is Search.FacetsResult => v !== null),
      take(1),
    );
  }

  /** Immediately invalidates the cache (e.g. after a resource deletion). */
  invalidate(): void {
    this._facetsCache.next(null);
  }

  private _resourceDeleted = new Subject<void>();
  resourceDeleted$ = this._resourceDeleted.asObservable();

  notifyDeletion(): void {
    this._resourceDeleted.next();
  }
}
