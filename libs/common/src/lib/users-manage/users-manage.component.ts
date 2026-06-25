import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  filter,
  forkJoin,
  map,
  Observable,
  of,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { SDKService } from '@flaps/core';
import { UsersManageService } from './users-manage.service';
import { FullKbUser, KBRoles, WritableKnowledgeBox } from '@nuclia/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { KB_ROLE_TITLES, SORTED_KB_ROLES } from '../utils';
import { detectDuplicates, isValidEmail, normalizeEmail, parseEmails } from './users-manage-email.utils';

type Order = 'role' | 'name';

interface UserRow extends FullKbUser {
  expires?: string;
}

type InviteEntryStatus = 'valid' | 'invalid' | 'duplicate' | 'existing' | 'failed';

interface InviteEntry {
  email: string;
  status: InviteEntryStatus;
}

@Component({
  selector: 'app-users-manage',
  templateUrl: './users-manage.component.html',
  styleUrls: ['./users-manage.component.scss'],
  providers: [UsersManageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class UsersManageComponent {
  @ViewChild('emailInputRef', { read: ElementRef }) emailInputRef?: ElementRef<HTMLElement>;
  @ViewChild('bulkInputRef', { read: ElementRef }) bulkInputRef?: ElementRef<HTMLElement>;

  @Input() set kb(value: WritableKnowledgeBox | undefined) {
    if (value) {
      this.users.setKb(value);
    }
  }

  addForm = this.formBuilder.group({
    emailInput: ['', [Validators.email]],
    bulkInput: [''],
    role: ['SMEMBER', [Validators.required]],
  });
  inviteEntries: InviteEntry[] = [];
  pasteModeOpen = false;
  inviteInProgress = false;
  summaryMessageParams: { [key: string]: number } = {};
  inviteErrorMessageKey = '';
  inviteErrorMessageParams: { [key: string]: number } = {};
  order = new BehaviorSubject<Order>('role');
  orderOpen = false;
  private existingUserEmails = new Set<string>();

  userRows: Observable<UserRow[]> = combineLatest([
    combineLatest([this.users.usersKb, this.users.invitesKb]).pipe(
      map(([users, invites]) => [...users, ...invites.map((invite) => ({ ...invite, id: invite.email, name: '-' }))]),
    ),
    this.order,
  ]).pipe(
    map(([users, order]) => {
      this.existingUserEmails = new Set(users.map((user) => normalizeEmail(user.email)));
      if (this.inviteEntries.length > 0) {
        this.recomputeInviteStatuses();
      }
      if (order === 'name') {
        return [...users].sort((a, b) => a.name.localeCompare(b.name));
      } else {
        return [...users].sort((a, b) => {
          const order = this.roles.indexOf(a.role) - this.roles.indexOf(b.role);
          return order === 0 ? a.name.localeCompare(b.name) : order;
        });
      }
    }),
  );
  userCount: Observable<number> = this.users.usersKb.pipe(map((users) => users.length));
  hasSeveralOwners: Observable<boolean> = this.users.usersKb.pipe(
    map((users: FullKbUser[]) => users.filter((user) => user.role === 'SOWNER')?.length > 1),
  );
  canAddUsers = this.sdk.currentAccount.pipe(
    map((account) => account.max_users == null || (account.current_users || 0) < account.max_users),
  );

  roles = SORTED_KB_ROLES;
  roleTitles = KB_ROLE_TITLES;

  constructor(
    private users: UsersManageService,
    private formBuilder: UntypedFormBuilder,
    private translate: TranslateService,
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
    private toaster: SisToastService,
    private modal: SisModalService,
  ) {}

  get currentEmailInput(): string {
    return (this.addForm.controls['emailInput'].value || '').trim();
  }

  get canAddTypedEmail(): boolean {
    return this.currentEmailInput.length > 0;
  }

  get hasInviteEntries(): boolean {
    return this.inviteEntries.length > 0;
  }

  get validCount(): number {
    return this.inviteEntries.filter((entry) => entry.status === 'valid').length;
  }

  get invalidCount(): number {
    return this.inviteEntries.filter((entry) => entry.status === 'invalid').length;
  }

  get duplicateCount(): number {
    return this.inviteEntries.filter((entry) => entry.status === 'duplicate').length;
  }

  get existingCount(): number {
    return this.inviteEntries.filter((entry) => entry.status === 'existing').length;
  }

  get failedCount(): number {
    return this.inviteEntries.filter((entry) => entry.status === 'failed').length;
  }

  get hasBlockingErrors(): boolean {
    return this.invalidCount > 0 || this.duplicateCount > 0;
  }

  get sendInvitesDisabled(): boolean {
    return this.inviteInProgress || this.sendableCount === 0 || this.hasBlockingErrors;
  }

  get sendableCount(): number {
    return this.inviteEntries.filter((entry) => entry.status === 'valid' || entry.status === 'failed').length;
  }

  get sendInvitesLabelKey(): string {
    return 'stash.users.send_invites';
  }

  get sendInvitesLabelParams(): { count: number } {
    return { count: this.sendableCount };
  }

  get bulkInputValue(): string {
    return this.addForm.controls['bulkInput'].value || '';
  }

  onPasteToggle(expanded: boolean): void {
    this.pasteModeOpen = expanded;
    if (expanded) {
      this.cdr.markForCheck();
      setTimeout(() => this.focusBulkInput(), 0);
    } else {
      this.addForm.controls['bulkInput'].setValue('');
      this.cdr.markForCheck();
    }
  }

  handleInputPaste(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text') || '';
    const parsed = parseEmails(pastedText);

    if (parsed.length > 1) {
      event.preventDefault();
      this.addEmails(parsed);
      this.addForm.controls['emailInput'].setValue('');
      this.cdr.markForCheck();
    }
  }

  handleEmailInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',' || event.key === ';') {
      event.preventDefault();
      this.addCurrentEmail();
      return;
    }

    if (event.key === 'Backspace' && !this.currentEmailInput && this.inviteEntries.length > 0) {
      event.preventDefault();
      this.removeInviteByIndex(this.inviteEntries.length - 1);
    }
  }

  addCurrentEmail(): void {
    const email = this.currentEmailInput;
    if (!email) {
      return;
    }
    this.addEmails([email]);
    this.addForm.controls['emailInput'].setValue('');
    this.cdr.markForCheck();
    setTimeout(() => this.focusEmailInput(), 0);
  }

  addBulkEmails(): void {
    const parsed = parseEmails(this.bulkInputValue);
    if (parsed.length === 0) {
      return;
    }

    this.addEmails(parsed);
    const hasIssuesAfter = this.hasBlockingErrors || this.existingCount > 0;

    this.addForm.controls['bulkInput'].setValue('');
    if (!hasIssuesAfter) {
      this.pasteModeOpen = false;
      this.cdr.markForCheck();
      setTimeout(() => this.focusEmailInput(), 0);
      return;
    }
    this.cdr.markForCheck();
    setTimeout(() => this.focusBulkInput(), 0);
  }

  removeInviteByIndex(index: number): void {
    this.inviteEntries = this.inviteEntries.filter((_, entryIndex) => entryIndex !== index);
    this.recomputeInviteStatuses();
    this.cdr.markForCheck();
    setTimeout(() => this.focusEmailInput(), 0);
  }

  clearAllInviteEntries(): void {
    this.inviteEntries = [];
    this.recomputeInviteStatuses();
    this.cdr.markForCheck();
    setTimeout(() => this.focusEmailInput(), 0);
  }

  private addEmails(rawEmails: string[]): void {
    const newEntries: InviteEntry[] = rawEmails.map((email) => ({ email: normalizeEmail(email), status: 'valid' }));
    this.inviteEntries = [...this.inviteEntries, ...newEntries];
    this.recomputeInviteStatuses();
  }

  private recomputeInviteStatuses(): void {
    const duplicates = detectDuplicates(this.inviteEntries.map((entry) => entry.email));
    const existing = this.existingUserEmails;

    this.inviteEntries = this.inviteEntries.map((entry) => {
      const email = normalizeEmail(entry.email);
      if (!isValidEmail(email)) {
        return { email, status: 'invalid' };
      }
      if (duplicates.has(email)) {
        return { email, status: 'duplicate' };
      }
      if (existing.has(email)) {
        return { email, status: 'existing' };
      }
      if (entry.status === 'failed') {
        return { email, status: 'failed' };
      }
      return { email, status: 'valid' };
    });

    this.summaryMessageParams = {
      valid: this.validCount,
      ready: this.sendableCount,
      invalid: this.invalidCount,
      duplicate: this.duplicateCount,
      existing: this.existingCount,
      failed: this.failedCount,
    };
  }

  inviteEntryStatusClass(status: InviteEntryStatus): string {
    if (status === 'invalid' || status === 'failed') {
      return 'chip-error';
    }
    if (status === 'duplicate' || status === 'existing') {
      return 'chip-warning';
    }
    return 'chip-valid';
  }

  inviteEntryStatusLabel(status: InviteEntryStatus): string {
    const keyByStatus: { [status in InviteEntryStatus]: string } = {
      valid: 'stash.users.status_valid',
      invalid: 'stash.users.status_invalid',
      duplicate: 'stash.users.status_duplicate',
      existing: 'stash.users.status_existing',
      failed: 'stash.users.status_failed',
    };
    return this.translate.instant(keyByStatus[status]);
  }

  removeInviteEntryAriaLabel(entry: InviteEntry): string {
    if (entry.status === 'invalid' || entry.status === 'failed') {
      return this.translate.instant('stash.users.remove_invalid_email', { email: entry.email });
    }
    if (entry.status === 'duplicate') {
      return this.translate.instant('stash.users.remove_duplicate_email', { email: entry.email });
    }
    return this.translate.instant('stash.users.remove_email', { email: entry.email });
  }

  addUser() {
    if (this.sendInvitesDisabled) return;

    const role = this.addForm.value.role as KBRoles;
    const sendableEntries = this.inviteEntries.filter((entry) => entry.status === 'valid' || entry.status === 'failed');
    const inviteEmails = sendableEntries.map((entry) => entry.email);

    if (inviteEmails.length === 0) {
      return;
    }

    this.inviteInProgress = true;
    this.inviteErrorMessageKey = '';
    this.inviteErrorMessageParams = {};

    return this.sdk.currentAccount
      .pipe(
        take(1),
        switchMap((account) =>
          this.sdk.nuclia.db.getAccountUsers(account.slug).pipe(map((accountUsers) => ({ accountUsers, account }))),
        ),
        switchMap(({ accountUsers, account }) => {
          if (!account.can_manage_account) {
            this.toaster.error(
              this.translate.instant('kb.users.insufficient-permissions', { email: inviteEmails.join(', ') }),
            );
            return of({ succeeded: [] as string[], failed: inviteEmails });
          }

          const existingAccountUsers = new Map(accountUsers.map((user) => [normalizeEmail(user.email), user.id]));
          const requests = inviteEmails.map((email) => {
            const existingUserId = existingAccountUsers.get(email);
            if (existingUserId) {
              return this.users.addUser(existingUserId, role).pipe(
                map(() => ({ email, ok: true })),
                catchError(() => of({ email, ok: false })),
              );
            }

            return this.users.inviteUser({ email, role }).pipe(
              map(() => ({ email, ok: true })),
              catchError(() => of({ email, ok: false })),
            );
          });

          return forkJoin(requests).pipe(
            map((results) => ({
              succeeded: results.filter((result) => result.ok).map((result) => result.email),
              failed: results.filter((result) => !result.ok).map((result) => result.email),
            })),
          );
        }),
      )
      .subscribe(({ succeeded, failed }) => {
        this.inviteInProgress = false;

        if (succeeded.length > 0) {
          this.toaster.success(this.translate.instant('stash.users.invites_sent', { count: succeeded.length }));
        }

        if (failed.length > 0) {
          this.inviteErrorMessageKey = 'stash.users.invites_partial';
          this.inviteErrorMessageParams = { success: succeeded.length, failed: failed.length };
          this.toaster.warning(this.translate.instant(this.inviteErrorMessageKey, this.inviteErrorMessageParams));
        }

        const failedSet = new Set(failed);
        this.inviteEntries = this.inviteEntries
          .filter((entry) => !succeeded.includes(entry.email))
          .map((entry) => ({
            ...entry,
            status: failedSet.has(entry.email) ? 'failed' : entry.status,
          }));

        this.addForm.controls['emailInput'].setValue('');
        this.addForm.controls['bulkInput'].setValue('');
        this.recomputeInviteStatuses();
        this.users.updateUsers();
        this.cdr?.markForCheck();
        setTimeout(() => this.focusEmailInput(), 0);
      }, () => {
        this.inviteInProgress = false;
        this.toaster.error('generic.error');
        this.cdr.markForCheck();
      });
  }

  private focusEmailInput(): void {
    this.emailInputRef?.nativeElement.querySelector('input')?.focus();
  }

  private focusBulkInput(): void {
    this.bulkInputRef?.nativeElement.querySelector('textarea')?.focus();
  }

  changeRole(userId: string, newRole: KBRoles) {
    this.users.changeRole(userId, newRole).subscribe();
  }

  changeOrder(order: Order) {
    this.order.next(order);
  }

  deleteUser(user: UserRow) {
    this.modal
      .openConfirm({
        title: 'stash.confirm_delete_user.title',
        description: 'stash.confirm_delete_user.description',
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((result) => !!result),
        switchMap(() => (user.expires ? this.users.deleteInvite(user.email) : this.users.deleteUser(user.id))),
      )
      .subscribe(() => {
        this.toaster.success('stash.users.user_deleted');
      });
  }
}
