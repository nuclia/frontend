import { inject, Injectable, signal } from '@angular/core';
import { SDKService } from '@flaps/core';
import { ConversationField, FIELD_TYPE, IResource, Message, Resource, Search, SortField } from '@nuclia/core';
import { BehaviorSubject, finalize, forkJoin, map, Observable, of, shareReplay, switchMap, take, tap } from 'rxjs';
import { DEFAULT_PAGE_SIZE, HISTORY_FIELD, HISTORY_LABEL } from '../context-box/context-box.service';

export interface ConversationsPage {
  items: { messages: Message[]; resource: IResource }[];
  // Whether the search backend may have more matching resources beyond this page.
  hasMore: boolean;
}

// Scoped to HistoryTableComponent: a fresh instance is created every time the history
// modal opens, so pagination/query state naturally resets and the first fetch fires on
// construction, with no need for the shareReplay refCount teardown/replay dance a
// root-provided singleton would require.
@Injectable()
export class HistoryTableService {
  private sdk = inject(SDKService);

  private userId = this.sdk.nuclia.auth.getJWTUser()?.sub || '';

  // The classic `/search` endpoint paginates `top_k`/`offset` over raw fulltext HITS, not
  // distinct resources, and dedups hits into resources afterwards. A history resource can
  // match on more than one indexed text field (e.g. the "history" conversation field and an
  // "answer1" JSON field), producing multiple hits for the same resource that aren't
  // guaranteed to be adjacent in the raw hit list. We over-fetch a larger raw batch per page
  // and track exactly which raw-hit index each page ends at (`pageCursors`), plus which
  // resource ids have already been assigned to an earlier page (`shownIds`), so a resource's
  // "extra" hit landing on the far side of a page boundary is skipped rather than re-shown.
  // Completed pages are cached (`pageCache`) since `shownIds` filtering is only valid the
  // first time a page is computed — recomputing an already-shown page would incorrectly
  // filter out its own (by-then "already shown") resources.
  private readonly RAW_BATCH_MULTIPLIER = 5;
  // NucliaDB's classic `/search` endpoint hard-caps `top_k` at 200.
  private readonly MAX_TOP_K = 200;
  private pageCursors: number[] = [0];
  private pageCache = new Map<number, ConversationsPage>();
  private shownIds = new Set<string>();

  private _page = signal(0);
  page = this._page.asReadonly();
  private _pageSize = signal(DEFAULT_PAGE_SIZE);
  pageSize = this._pageSize.asReadonly();
  private _query = signal('');
  query = this._query.asReadonly();
  // Whether there may be more results beyond the current page (see ConversationsPage.hasMore).
  private _hasMore = signal(false);
  hasMore = this._hasMore.asReadonly();

  private _forceRefresh = new BehaviorSubject<void>(undefined);

  private _loading = signal(true);
  loading = this._loading.asReadonly();

  conversations: Observable<ConversationsPage> = this._forceRefresh.pipe(
    tap(() => this._loading.set(true)),
    switchMap(() =>
      this.getConversationsPage(this._page(), this._pageSize(), this._query()).pipe(
        tap((result) => this._hasMore.set(result.hasMore)),
        finalize(() => this._loading.set(false)),
      ),
    ),
    shareReplay({ refCount: true, bufferSize: 1 }),
  );

  loadPage(page: number) {
    this._page.set(page);
    this._forceRefresh.next();
  }

  setPageSize(pageSize: number) {
    this._page.set(0);
    this.resetPaging();
    this._pageSize.set(pageSize);
    this._forceRefresh.next();
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
    this.resetPaging();
    this._forceRefresh.next();
  }

  refresh() {
    // Deleting a question shifts everything after it in the underlying result stream, which
    // would invalidate cached pages/cursors beyond the current one — reset back to page 0 to
    // guarantee correctness rather than risk showing stale or misaligned pages.
    this._page.set(0);
    this.resetPaging();
    this._forceRefresh.next();
  }

  private resetPaging() {
    this.pageCursors = [0];
    this.pageCache.clear();
    this.shownIds.clear();
  }

  private getConversationsPage(page: number, pageSize: number, query: string): Observable<ConversationsPage> {
    const cached = this.pageCache.get(page);
    if (cached) {
      return of(cached);
    }

    const rawOffset = this.pageCursors[page] ?? 0;
    const batchTopK = Math.min(pageSize * this.RAW_BATCH_MULTIPLIER, this.MAX_TOP_K);
    return this.sdk.currentKb.pipe(take(1)).pipe(
      switchMap((kb) =>
        kb
          .search(query, [Search.Features.FULLTEXT], {
            top_k: batchTopK,
            offset: rawOffset,
            security: { groups: [this.userId] },
            filter_expression: {
              field: { prop: 'label', ...HISTORY_LABEL },
            },
            sort: { field: SortField.created, order: 'desc' },
          })
          .pipe(
            map((result) => {
              if (result.type === 'error') {
                throw new Error('Error fetching messages');
              }
              return result;
            }),
            switchMap((result) => {
              // Walk the raw (order-preserved, possibly resource-duplicated) hit list, skipping
              // hits for resources already assigned to an earlier page or already collected on
              // this page, and stop right before the hit that would start a new resource beyond
              // `pageSize` — so the next page's cursor never lands mid-resource.
              const rawHits = result.fulltext?.results || [];
              const seenIds: string[] = [];
              const localSeen = new Set<string>();
              let cutIndex = rawHits.length;
              for (let i = 0; i < rawHits.length; i++) {
                const rid = rawHits[i].rid;
                if (this.shownIds.has(rid) || localSeen.has(rid)) {
                  continue;
                }
                if (seenIds.length === pageSize) {
                  cutIndex = i;
                  break;
                }
                localSeen.add(rid);
                seenIds.push(rid);
              }
              this.pageCursors[page + 1] = rawOffset + cutIndex;
              const hasMore = cutIndex < rawHits.length || !!result.fulltext?.next_page;
              seenIds.forEach((id) => this.shownIds.add(id));

              const resourcesById = result.resources || {};
              const resources = seenIds
                .map((id) => resourcesById[id])
                .filter((resource): resource is IResource => !!resource);
              const pageResult$ =
                resources.length === 0
                  ? of({ items: [], hasMore })
                  : forkJoin(
                      resources.map((resource) =>
                        new Resource(this.sdk.nuclia, kb.id, { id: resource.id })
                          .getField(FIELD_TYPE.conversation, HISTORY_FIELD)
                          .pipe(
                            map((field) => ({
                              resource,
                              messages: (field.value as ConversationField).messages,
                            })),
                          ),
                      ),
                    ).pipe(map((items) => ({ items, hasMore })));
              return pageResult$.pipe(tap((pageResult) => this.pageCache.set(page, pageResult)));
            }),
          ),
      ),
    );
  }
}
