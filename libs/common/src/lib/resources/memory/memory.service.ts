import { Injectable, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { formatDate } from '@angular/common';
import { FIELD_TYPE, Resource, ResourceFieldProperties } from '@nuclia/core';
import {
  Observable,
  catchError,
  filter,
  forkJoin,
  from,
  map,
  mergeMap,
  of,
  shareReplay,
  switchMap,
  take,
  tap,
  toArray,
} from 'rxjs';
import { EditResourceService } from '../edit-resource';
import { getConversationMessages, getMemorySessionInfos, parseMemoryEntry, parseMemoryFact } from './memory.helpers';
import { MemoryEntry, MemoryFact, MemorySessionInfo } from './memory.model';

/** Max number of concurrent field fetches when batch-loading facts/entries, to avoid firing
 * one request per session all at once (mirrors the concurrency limit used for batch uploads). */
const MEMORY_LOAD_CONCURRENCY = 6;

@Injectable()
export class MemoryService {
  private editResource = inject(EditResourceService);
  private resourceSignal = toSignal(this.editResource.resource, { initialValue: null });

  private _facts = signal<MemoryFact[]>([]);
  private _loading = signal(false);
  private _loadedSessionCount = signal(0);
  private _sessionEntries = signal<Record<string, MemoryEntry[]>>({});
  private _sessionEntriesLoading = signal<Record<string, boolean>>({});
  // In-flight request per session, so overlapping `loadSessionEntries` calls share one HTTP request instead of duplicating it.
  private _inFlightSessionEntries: Record<string, Observable<MemoryEntry[]>> = {};
  private _searchTerm = signal('');
  private _dateFilter = signal<string | null>(null);

  /** Shallow list of the topic's sessions (field ids + entry/fact counts), no message values. */
  sessionInfos = computed<MemorySessionInfo[]>(() => {
    const resource = this.resourceSignal();
    return resource ? getMemorySessionInfos(resource) : [];
  });

  resource = computed(() => this.resourceSignal());

  /** True as soon as the resource has at least one memory session field (no extra fetch needed). */
  isMemoryResource = computed(() => this.sessionInfos().length > 0);
  totalSessionCount = computed(() => this.sessionInfos().length);
  /** Whether any facts exist at all across the topic, regardless of the active search/date filter. */
  hasAnyFacts = computed(() => this._facts().length > 0);

  loading = this._loading.asReadonly();
  loadedSessionCount = this._loadedSessionCount.asReadonly();
  searchTerm = this._searchTerm.asReadonly();
  dateFilter = this._dateFilter.asReadonly();
  /** Cache of loaded session entries, keyed by session field id. Read reactively from templates. */
  sessionEntries = this._sessionEntries.asReadonly();

  /** Facts across all sessions in the topic, filtered by search/date and sorted most-recent-first. */
  filteredFacts = computed<MemoryFact[]>(() => {
    const term = this._searchTerm().trim().toLowerCase();
    const date = this._dateFilter();
    const selectedDateKey = date ? formatDate(date, 'yyyy-MM-dd', 'en-US') : null;
    return this._facts()
      .filter((fact) => {
        if (
          selectedDateKey &&
          (!fact.timestamp || formatDate(fact.timestamp, 'yyyy-MM-dd', 'en-US') !== selectedDateKey)
        )
          return false;
        if (term && !fact.content.text.toLowerCase().includes(term)) return false;
        return true;
      })
      .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  });

  setSearchTerm(term: string) {
    this._searchTerm.set(term);
  }

  setDateFilter(dateIso: string | null) {
    this._dateFilter.set(dateIso);
  }

  /**
   * Loads every session's facts field before showing the full, filterable list.
   * Waits for `editResource.resource` (not the not-yet-ready `resourceSignal()`) since the
   * resource can still be `null` when the memory tab is opened directly on page load.
   */
  loadAllFacts(): Observable<void> {
    return this.editResource.resource.pipe(
      filter((resource): resource is Resource => !!resource),
      take(1),
      switchMap((resource) => {
        const sessions = getMemorySessionInfos(resource);
        if (sessions.length === 0) {
          this._facts.set([]);
          return of(undefined);
        }
        this._loading.set(true);
        this._loadedSessionCount.set(0);
        this._facts.set([]);
        return from(sessions).pipe(
          mergeMap(
            (session) =>
              this.loadFactsForSession(resource, session).pipe(
                tap((facts) => {
                  this._facts.update((list) => list.concat(facts));
                  this._loadedSessionCount.update((n) => n + 1);
                }),
              ),
            MEMORY_LOAD_CONCURRENCY,
          ),
          toArray(),
          tap(() => this._loading.set(false)),
          map(() => undefined),
        );
      }),
    );
  }

  isSessionEntriesLoading(sessionFieldId: string): boolean {
    return !!this._sessionEntriesLoading()[sessionFieldId];
  }

  loadSessionEntries(sessionFieldId: string): Observable<MemoryEntry[]> {
    const cached = this._sessionEntries()[sessionFieldId];
    if (cached) return of(cached);
    // Reuse an in-flight request instead of firing a duplicate (e.g. expanding two facts from the same session at once).
    const inFlight = this._inFlightSessionEntries[sessionFieldId];
    if (inFlight) return inFlight;

    const resource = this.resourceSignal();
    if (!resource) return of([]);

    const info = this.sessionInfos().find((session) => session.fieldId === sessionFieldId);
    this._sessionEntriesLoading.update((map) => ({ ...map, [sessionFieldId]: true }));
    const request$ = this.loadAllConversationMessages(resource, sessionFieldId, info?.pages).pipe(
      map((messages) => messages.map((message) => parseMemoryEntry(message, sessionFieldId)).filter(isNotNull)),
      tap((entries) => this._sessionEntries.update((map) => ({ ...map, [sessionFieldId]: entries }))),
      catchError(() => of([])),
      tap(() => {
        this._sessionEntriesLoading.update((map) => ({ ...map, [sessionFieldId]: false }));
        delete this._inFlightSessionEntries[sessionFieldId];
      }),
      shareReplay(1),
    );

    this._inFlightSessionEntries[sessionFieldId] = request$;
    return request$;
  }

  private loadFactsForSession(resource: Resource, session: MemorySessionInfo): Observable<MemoryFact[]> {
    return this.loadAllConversationMessages(resource, session.factsFieldId, session.pages).pipe(
      map((messages) => messages.map((message) => parseMemoryFact(message, session.factsFieldId)).filter(isNotNull)),
      // A session may not have a facts field yet if nothing has been extracted from it so far.
      catchError(() => of([])),
    );
  }

  private loadAllConversationMessages(resource: Resource, fieldId: string, pages: number | undefined) {
    const pageNumbers = Array.from({ length: pages && pages > 0 ? pages : 1 }, (_, index) => index + 1);
    return forkJoin(
      pageNumbers.map((page) =>
        resource
          .getField(FIELD_TYPE.conversation, fieldId, [ResourceFieldProperties.VALUE], [], page)
          .pipe(map((field) => ({ page, messages: getConversationMessages(field.value) }))),
      ),
    ).pipe(map((results) => results.sort((a, b) => a.page - b.page).flatMap((result) => result.messages)));
  }
}

function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}
