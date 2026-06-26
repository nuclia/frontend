import { computed, DestroyRef, effect, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  concatMap,
  EMPTY,
  filter,
  finalize,
  from,
  map,
  Observable,
  of,
  ReplaySubject,
  shareReplay,
  switchMap,
  take,
  tap,
  timer,
} from 'rxjs';
import { SDKService } from '@flaps/core';
import { Account, FullAccountUser, FullKbUser, InviteKbData, KBRoles, WritableKnowledgeBox } from '@nuclia/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { SORTED_KB_ROLES } from '../utils';
import { InviteEntry, InviteEntryStatus, InviteProgress, Order, UserRow } from './users-manage.model';

const EMAIL_SPLIT_REGEX = /[,;\n\r\t\s]+/;
const VISIBLE_CHIPS_LIMIT = 10;

@Injectable()
export class UsersManageService {
  private readonly sdk = inject(SDKService);
  private readonly toaster = inject(SisToastService);
  private readonly translate = inject(TranslateService);
  private readonly modal = inject(SisModalService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _beforeUnloadHandler = (event: BeforeUnloadEvent) => {
    event.preventDefault();
  };

  constructor() {
    effect(() => {
      if (this.inviteInProgress()) {
        window.addEventListener('beforeunload', this._beforeUnloadHandler);
      } else {
        window.removeEventListener('beforeunload', this._beforeUnloadHandler);
      }
    });
    this.destroyRef.onDestroy(() => window.removeEventListener('beforeunload', this._beforeUnloadHandler));
  }

  private readonly _onUpdateUsers = new BehaviorSubject<null>(null);
  private readonly _kb = new ReplaySubject<WritableKnowledgeBox>(1);
  private existingUserEmails = new Set<string>();

  // --- Invite state ---
  readonly inviteEntries = signal<InviteEntry[]>([]);
  readonly showAllChips = signal(false);
  readonly inviteInProgress = signal(false);
  readonly inviteProgress = signal<InviteProgress>({ invited: 0, failed: 0, pending: 0 });
  readonly inviteError = signal<{ key: string; params: Record<string, number> } | null>(null);

  // --- Computed ---
  readonly hasInviteEntries = computed(() => this.inviteEntries().length > 0);
  readonly counts = computed(() =>
    this.inviteEntries().reduce(
      (acc, e) => {
        acc[e.status]++;
        if (e.status === 'valid' || e.status === 'failed') acc.ready++;
        return acc;
      },
      { valid: 0, invalid: 0, duplicate: 0, existing: 0, failed: 0, ready: 0 },
    ),
  );
  readonly hasBlockingErrors = computed(() => this.counts().invalid > 0 || this.counts().duplicate > 0);
  readonly sendInvitesDisabled = computed(
    () => this.inviteInProgress() || this.counts().ready === 0 || this.hasBlockingErrors(),
  );
  readonly visibleChips = computed(() =>
    this.showAllChips() ? this.inviteEntries() : this.inviteEntries().slice(0, VISIBLE_CHIPS_LIMIT),
  );
  readonly hiddenChipsCount = computed(() => Math.max(0, this.inviteEntries().length - VISIBLE_CHIPS_LIMIT));

  // --- User list ---
  readonly order = new BehaviorSubject<Order>('role');

  readonly usersKb = this._onUpdateUsers.pipe(
    switchMap(() =>
      this._kb.pipe(
        take(1),
        switchMap((kb) => kb.getUsers()),
      ),
    ),
    shareReplay(1),
  );

  readonly invitesKb = this._onUpdateUsers.pipe(
    switchMap(() => this._kb.pipe(take(1))),
    switchMap((kb) => kb.getInvites()),
    map((invites) => invites.map((invite) => ({ ...invite, expires: invite.expires + 'Z' }))),
    shareReplay(1),
  );

  readonly userRows: Observable<UserRow[]> = combineLatest([
    combineLatest([this.usersKb, this.invitesKb]).pipe(
      map(([users, invites]) => [...users, ...invites.map((invite) => ({ ...invite, id: invite.email, name: '-' }))]),
    ),
    this.order,
  ]).pipe(
    map(([users, order]) => {
      this.existingUserEmails = new Set(users.map((user) => this.normalizeEmail(user.email)));
      if (this.inviteEntries().length > 0) {
        this.recomputeStatuses();
      }
      return this.sortUsers(users, order);
    }),
  );

  readonly userCount: Observable<number> = this.usersKb.pipe(map((users) => users.length));

  readonly hasSeveralOwners: Observable<boolean> = this.usersKb.pipe(
    map((users: FullKbUser[]) => users.filter((user) => user.role === 'SOWNER').length > 1),
  );

  readonly canAddUsers = this.sdk.currentAccount.pipe(
    map((account) => account.max_users == null || (account.current_users || 0) < account.max_users),
  );

  // --- KB management ---

  setKb(kb: WritableKnowledgeBox): void {
    this._kb.next(kb);
    this.updateUsers();
  }

  updateUsers(): void {
    this._onUpdateUsers.next(null);
  }

  changeOrder(order: Order): void {
    this.order.next(order);
  }

  inviteUser(data: InviteKbData): Observable<void> {
    return this._kb.pipe(
      take(1),
      switchMap((kb) => kb.inviteToKb(data)),
      tap(() => this.updateUsers()),
    );
  }

  addUser(id: string, role: KBRoles): Observable<void> {
    return this._kb.pipe(
      take(1),
      switchMap((kb) => kb.updateUsers({ add: [{ id, role }] })),
      tap(() => this.updateUsers()),
    );
  }

  changeRole(userId: string, role: KBRoles): void {
    this._kb
      .pipe(
        take(1),
        switchMap((kb) => kb.updateUsers({ update: [{ id: userId, role }] })),
        tap(() => this.updateUsers()),
      )
      .subscribe();
  }

  deleteUser(userId: string): Observable<void> {
    return this._kb.pipe(
      take(1),
      switchMap((kb) => kb.updateUsers({ delete: [userId] })),
      tap(() => this.updateUsers()),
    );
  }

  deleteInvite(email: string): Observable<void> {
    return this._kb.pipe(
      take(1),
      switchMap((kb) => kb.deleteInvite(email)),
      tap(() => this.updateUsers()),
    );
  }

  // --- Invite entries management ---

  addEmailsFromText(input: string): void {
    const parsed = this.parseEmails(input);
    if (parsed.length === 0) return;
    const newEntries: InviteEntry[] = parsed.map((email) => ({
      id: crypto.randomUUID(),
      email: this.normalizeEmail(email),
      status: 'valid' as InviteEntryStatus,
    }));
    this.inviteEntries.update((entries) => [...entries, ...newEntries]);
    this.recomputeStatuses();
  }

  clearAllEntries(): void {
    this.inviteEntries.set([]);
    this.showAllChips.set(false);
  }

  clearBlockingEntries(): void {
    this.inviteEntries.update((entries) =>
      entries.filter((e) => e.status !== 'invalid' && e.status !== 'duplicate' && e.status !== 'existing'),
    );
    if (this.inviteEntries().length <= VISIBLE_CHIPS_LIMIT) {
      this.showAllChips.set(false);
    }
  }

  removeEntryByIndex(index: number): void {
    this.inviteEntries.update((entries) => entries.filter((_, i) => i !== index));
    if (this.inviteEntries().length <= VISIBLE_CHIPS_LIMIT) {
      this.showAllChips.set(false);
    }
    this.recomputeStatuses();
  }

  toggleShowAllChips(): void {
    this.showAllChips.update((v) => !v);
  }

  // --- Send invites ---

  sendInvites(role: KBRoles): void {
    const sendableEntries = this.inviteEntries().filter((e) => e.status === 'valid' || e.status === 'failed');
    if (sendableEntries.length === 0) return;

    this.inviteInProgress.set(true);
    this.inviteProgress.set({ invited: 0, failed: 0, pending: sendableEntries.length });
    this.inviteError.set(null);

    this.sdk.currentAccount
      .pipe(
        take(1),
        switchMap((account) =>
          this.sdk.nuclia.db.getAccountUsers(account.slug).pipe(map((accountUsers) => ({ accountUsers, account }))),
        ),
        switchMap(({ accountUsers, account }) => this.buildInviteStream(sendableEntries, role, accountUsers, account)),
        finalize(() => this.onSendComplete()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        error: () => {
          this.inviteInProgress.set(false);
          this.toaster.error('generic.error');
        },
      });
  }

  private buildInviteStream(
    sendableEntries: InviteEntry[],
    role: KBRoles,
    accountUsers: FullAccountUser[],
    account: Account,
  ): Observable<{ email: string; ok: boolean }> {
    if (!account.can_manage_account) {
      this.toaster.error(
        this.translate.instant('kb.users.insufficient-permissions', {
          email: sendableEntries.map((e) => e.email).join(', '),
        }),
      );
      this.inviteInProgress.set(false);
      return EMPTY;
    }

    const existingAccountUsers = new Map(accountUsers.map((u) => [this.normalizeEmail(u.email), u.id]));

    return from(sendableEntries).pipe(
      concatMap((entry, index) => this.buildSingleRequest(entry, index, role, existingAccountUsers)),
      tap((result) => this.handleInviteResult(result)),
    );
  }

  private buildSingleRequest(
    entry: InviteEntry,
    index: number,
    role: KBRoles,
    existingAccountUsers: Map<string, string>,
  ): Observable<{ email: string; ok: boolean }> {
    const { email } = entry;
    const existingUserId = existingAccountUsers.get(email);
    const req = (existingUserId ? this.addUser(existingUserId, role) : this.inviteUser({ email, role })).pipe(
      map(() => ({ email, ok: true as const })),
      catchError(() => of({ email, ok: false as const })),
    );
    return index > 0 && index % 30 === 0 ? timer(61000).pipe(switchMap(() => req)) : req;
  }

  private handleInviteResult(result: { email: string; ok: boolean }): void {
    if (result.ok) {
      this.inviteProgress.update((p) => ({ ...p, invited: p.invited + 1, pending: Math.max(0, p.pending - 1) }));
      this.inviteEntries.update((entries) => entries.filter((e) => e.email !== result.email));
    } else {
      this.inviteProgress.update((p) => ({ ...p, failed: p.failed + 1, pending: Math.max(0, p.pending - 1) }));
      this.inviteEntries.update((entries) =>
        entries.map((e) => (e.email === result.email ? { ...e, status: 'failed' as InviteEntryStatus } : e)),
      );
    }
    if (this.inviteEntries().length <= VISIBLE_CHIPS_LIMIT) {
      this.showAllChips.set(false);
    }
  }

  private onSendComplete(): void {
    this.inviteInProgress.set(false);
    if (this.inviteProgress().invited > 0) {
      this.toaster.success(
        this.translate.instant('stash.users.invites_sent', { count: this.inviteProgress().invited }),
      );
    }
    if (this.inviteProgress().failed > 0) {
      const key = 'stash.users.invites_partial';
      const params = { success: this.inviteProgress().invited, failed: this.inviteProgress().failed };
      this.inviteError.set({ key, params });
      this.toaster.warning(this.translate.instant(key, params));
    }
    this.recomputeStatuses();
    this.updateUsers();
  }

  private recomputeStatuses(): void {
    const existing = this.existingUserEmails;
    const claimed = new Set<string>();

    this.inviteEntries.update((entries) =>
      entries.map((entry) => {
        const email = this.normalizeEmail(entry.email);
        if (!this.isValidEmail(email)) return { ...entry, email, status: 'invalid' as InviteEntryStatus };
        if (existing.has(email)) return { ...entry, email, status: 'existing' as InviteEntryStatus };
        if (claimed.has(email)) return { ...entry, email, status: 'duplicate' as InviteEntryStatus };
        claimed.add(email);
        if (entry.status === 'failed') return { ...entry, email, status: 'failed' as InviteEntryStatus };
        return { ...entry, email, status: 'valid' as InviteEntryStatus };
      }),
    );
  }

  private sortUsers(users: UserRow[], order: Order): UserRow[] {
    if (order === 'name') {
      return [...users].sort((a, b) => a.name.localeCompare(b.name));
    }
    return [...users].sort((a, b) => {
      const diff = SORTED_KB_ROLES.indexOf(a.role) - SORTED_KB_ROLES.indexOf(b.role);
      return diff === 0 ? a.name.localeCompare(b.name) : diff;
    });
  }

  // --- Email utilities ---

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private parseEmails(input: string): string[] {
    return input
      .split(EMAIL_SPLIT_REGEX)
      .map((e) => this.normalizeEmail(e))
      .filter((e) => e.length > 0);
  }

  private isValidEmail(email: string): boolean {
    return Validators.email({ value: this.normalizeEmail(email) } as AbstractControl) === null;
  }

  // --- User deletion (with modal confirmation) ---

  confirmDeleteUser(user: UserRow): void {
    this.modal
      .openConfirm({
        title: 'stash.confirm_delete_user.title',
        description: 'stash.confirm_delete_user.description',
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((result) => !!result),
        switchMap(() => (user.expires ? this.deleteInvite(user.email) : this.deleteUser(user.id))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.toaster.success('stash.users.user_deleted');
      });
  }
}
