import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, Observable, of, Subject, take } from 'rxjs';
import { catchError, filter, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { SDKService } from '@flaps/core';
import {
  Account,
  AccountRoles,
  AccountUsersPayload,
  FullAccountUser,
  InviteAccountUserPayload,
  PendingInvitation,
} from '@nuclia/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';

@Component({
  selector: 'app-account-users',
  templateUrl: './account-users.component.html',
  styleUrls: ['./account-users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountUsersComponent implements OnDestroy, OnInit {
  account?: Account;
  users: FullAccountUser[] = [];
  invitations: PendingInvitation[] = [];
  form = new FormGroup({
    email: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    role: new FormControl<AccountRoles>('AMEMBER', { nonNullable: true, validators: [Validators.required] }),
  });

  roles: AccountRoles[] = ['AMEMBER', 'AOWNER'];
  roleTranslations: { [role: string]: string } = {
    AOWNER: 'generic.owner',
    AMEMBER: 'generic.member',
  };

  account$ = this.sdk.currentAccount;
  canAddUsers = this.account$.pipe(
    map((account) => account!.max_users == null || (account!.current_users || 0) < account!.max_users),
  );

  unsubscribeAll = new Subject<void>();

  get email() {
    return this.form.controls.email.value;
  }

  constructor(
    private translate: TranslateService,
    private sdk: SDKService,
    private toaster: SisToastService,
    private cdr: ChangeDetectorRef,
    private modalService: SisModalService,
  ) {}

  ngOnInit() {
    this.account$
      .pipe(
        tap((account) => {
          this.account = account;
        }),
        switchMap((account) => this.updateUsers(account)),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(() => this.cdr.markForCheck());
  }

  isItMe(userId?: string) {
    return this.sdk.nuclia.auth.getJWTUser()?.sub === userId;
  }

  updateUsers(account: Account): Observable<void> {
    return forkJoin([
      this.sdk.nuclia.db.getAccountUsers(account.slug),
      this.sdk.nuclia.db.getAccountInvitations(account.id).pipe(catchError(() => of([]))),
    ]).pipe(
      map(([users, pendingInvitations]) => {
        this.users = users;
        this.invitations = pendingInvitations;
        this.cdr.markForCheck();
      }),
    );
  }

  addUser() {
    const data: InviteAccountUserPayload = this.form.getRawValue();
    this.sdk.nuclia.db.inviteToAccount(this.account!.slug, data).subscribe(() => {
      this.toaster.success(this.translate.instant('account.invited_user', { user: this.email }));
      this.form.patchValue({ email: '', role: 'AMEMBER' });
      this.form.markAsPristine();
      this.cdr.markForCheck();
    });
  }

  changeRole(user: FullAccountUser, role: string): void {
    if (role === 'AMEMBER') {
      this._changeRole(user, role)
        .pipe(
          switchMap(() => this.account$.pipe(take(1))),
          switchMap((account) => this.updateUsers(account)),
        )
        .subscribe();
    } else {
      this.modalService
        .openConfirm({
          title: 'account.admin.make_admin',
          description: 'account.admin.warning',
        })
        .onClose.pipe(
          switchMap((result) => (!!result ? this._changeRole(user, role as AccountRoles) : of(null))),
          switchMap(() => this.account$.pipe(take(1))),
          switchMap((account) => this.updateUsers(account)),
          takeUntil(this.unsubscribeAll),
        )
        .subscribe();
    }
  }

  deleteUserConfirm(user: FullAccountUser): void {
    this.translate
      .get('account.delete_user_warning', { username: `${user.name} (${user.email})` })
      .pipe(
        switchMap(
          (message) =>
            this.modalService.openConfirm({
              title: 'account.delete_user',
              description: message,
              confirmLabel: 'generic.delete',
              isDestructive: true,
            }).onClose,
        ),
        filter((confirm) => !!confirm),
        switchMap(() => this.deleteUser(user)),
        switchMap(() => this.account$.pipe(take(1))),
        switchMap((account) =>
          this.updateUsers(account).pipe(switchMap(() => this.sdk.nuclia.db.getAccount(account.slug))),
        ),
      )
      .subscribe((account) => (this.sdk.account = account));
  }

  private _changeRole(user: FullAccountUser, role: AccountRoles): Observable<void> {
    const users: AccountUsersPayload = {
      add: [{ id: user.id, role: role }],
    };
    return this.sdk.nuclia.db.setAccountUsers(this.account!.slug, users);
  }

  deleteUser(user: FullAccountUser): Observable<void> {
    const users: AccountUsersPayload = {
      delete: [user.id],
    };
    return this.sdk.nuclia.db.setAccountUsers(this.account!.slug, users);
  }

  deleteInvitation(invite: PendingInvitation) {
    this.account$
      .pipe(
        take(1),
        switchMap((account) => this.sdk.nuclia.db.deleteAccountInvitation(account.id, invite.email)),
        tap(() =>
          this.toaster.success(this.translate.instant('account.toast.delete-invite-success', { email: invite.email })),
        ),
        catchError(() => {
          this.toaster.error(this.translate.instant('account.toast.delete-invite-failure', { email: invite.email }));
          return of();
        }),
        switchMap(() => this.account$.pipe(take(1))),
        switchMap((account) =>
          this.updateUsers(account).pipe(switchMap(() => this.sdk.nuclia.db.getAccount(account.slug))),
        ),
      )
      .subscribe((account) => (this.sdk.account = account));
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
