import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SisToastService } from '@nuclia/sistema';
import { catchError, of, Subject, switchMap, tap } from 'rxjs';
import { UserSummary } from '../../manage-users/user.models';
import { RecipientFilter } from '../email.models';
import { getEmailErrorMessage } from '../email.service';
import { RecipientsLoaderService } from './recipients-loader.service';
import { UserSegment } from './user-segments';

export const DEFAULT_RECIPIENT_FILTER: RecipientFilter = 'AOWNER';

const byName = (a: UserSummary, b: UserSummary) => (a.name || a.email).localeCompare(b.name || b.email);

/** Filters, loaded users and selection of the recipients step. Provided by the wizard component. */
@Injectable()
export class RecipientsService {
  private loader = inject(RecipientsLoaderService);
  private toast = inject(SisToastService);
  private destroyRef = inject(DestroyRef);
  private reload$ = new Subject<void>();
  // Users listed by the filters are selected by default; only the manually unchecked ones are remembered
  private excluded = new Set<string>();

  private _recipientFilter = signal<RecipientFilter>(DEFAULT_RECIPIENT_FILTER);
  private _segmentFilter = signal<UserSegment[]>([]);
  private _users = signal<UserSummary[]>([]);
  private _selected = signal<ReadonlyMap<string, UserSummary>>(new Map());
  private _loading = signal(false);
  private _loadingError = signal(false);

  recipientFilter = this._recipientFilter.asReadonly();
  segmentFilter = this._segmentFilter.asReadonly();
  users = this._users.asReadonly();
  selected = this._selected.asReadonly();
  loading = this._loading.asReadonly();
  loadingError = this._loadingError.asReadonly();
  search = signal('');

  hasActiveFilters = computed(
    () =>
      this.recipientFilter() !== DEFAULT_RECIPIENT_FILTER || this.segmentFilter().length > 0 || !!this.search().trim(),
  );
  filteredUsers = computed(() => {
    const term = this.search().trim().toLowerCase();
    const users = term
      ? this.users().filter((user) => `${user.name || ''} ${user.email}`.toLowerCase().includes(term))
      : this.users();
    return users.toSorted(byName);
  });
  selectedUsers = computed(() => Array.from(this.selected().values()).sort(byName));
  allFilteredSelected = computed(() => {
    const selected = this.selected();
    const filtered = this.filteredUsers();
    return filtered.length > 0 && filtered.every((user) => selected.has(user.id));
  });

  constructor() {
    this.reload$
      .pipe(
        tap(() => {
          this._loading.set(true);
          this._loadingError.set(false);
        }),
        switchMap(() =>
          this.loader.load(this.recipientFilter(), this.segmentFilter()).pipe(
            catchError((error) => {
              this.toast.error(getEmailErrorMessage(error));
              this._loadingError.set(true);
              return of([] as UserSummary[]);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((users) => {
        this._users.set(users);
        this._selected.set(new Map(users.filter((user) => !this.excluded.has(user.id)).map((user) => [user.id, user])));
        this._loading.set(false);
      });
    this.reload();
  }

  selectFilter(filter: RecipientFilter) {
    this._recipientFilter.set(filter);
    this.search.set('');
    this.reload();
  }

  selectSegments(segments: UserSegment[]) {
    this._segmentFilter.set(segments);
    this.search.set('');
    this.reload();
  }

  resetFilters() {
    this._recipientFilter.set(DEFAULT_RECIPIENT_FILTER);
    this._segmentFilter.set([]);
    this.search.set('');
    this.reload();
  }

  reload() {
    this.reload$.next();
  }

  /** Back to the default filters with the default selection, forgetting the manual unchecks. */
  reset() {
    this.excluded.clear();
    this._selected.set(new Map());
    this.resetFilters();
  }

  isSelected(userId: string): boolean {
    return this.selected().has(userId);
  }

  toggleUser(user: UserSummary, checked: boolean) {
    this.setSelection([user], checked);
  }

  toggleAllFiltered(checked: boolean) {
    this.setSelection(this.filteredUsers(), checked);
  }

  /** Unselects every listed user that is not in the given set. */
  keepOnly(userIds: Set<string>) {
    this.setSelection(
      this.users().filter((user) => !userIds.has(user.id)),
      false,
    );
  }

  private setSelection(users: UserSummary[], checked: boolean) {
    const next = new Map(this.selected());
    users.forEach((user) => {
      if (checked) {
        next.set(user.id, user);
        this.excluded.delete(user.id);
      } else {
        next.delete(user.id);
        this.excluded.add(user.id);
      }
    });
    this._selected.set(next);
  }
}
