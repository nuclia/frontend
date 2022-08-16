import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of, Subject } from 'rxjs';
import { filter, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { AccountRoles, AccountUser, SDKService, SetUsersAccount, StateService, UsersService } from '@flaps/core';
import { Account } from '@nuclia/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';

@Component({
  selector: 'app-account-users',
  templateUrl: './account-users.component.html',
  styleUrls: ['./account-users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountUsersComponent implements OnDestroy {
  account?: Account;
  users?: AccountUser[];
  columns = ['user', 'role', 'actions'];
  email = new UntypedFormControl([''], [Validators.required, Validators.email]);
  roles: [AccountRoles, string][] = [
    ['AOWNER', 'generic.owner'],
    ['AMEMBER', 'generic.member'],
  ];

  account$ = this.stateService.account.pipe(filter((account) => !!account));
  canAddUsers = this.account$.pipe(
    map((account) => account!.max_users == null || account!.current_users < account!.max_users),
  );

  unsubscribeAll = new Subject<void>();

  constructor(
    private usersService: UsersService,
    private stateService: StateService,
    private translate: TranslateService,
    private sdk: SDKService,
    private toaster: SisToastService,
    private cdr: ChangeDetectorRef,
    private modalService: SisModalService,
  ) {
    this.account$
      .pipe(
        takeUntil(this.unsubscribeAll),
        tap((account) => {
          this.account = account!;
        }),
        switchMap(() => this.updateUsers()),
      )
      .subscribe(() => {
        this.cdr?.markForCheck();
      });
  }

  isItMe(userId: string) {
    return this.sdk.nuclia.auth.getJWTUser()?.sub === userId;
  }

  updateUsers(): Observable<AccountUser[]> {
    return this.usersService.getAccountUsers(this.account!.slug).pipe(
      tap((users) => {
        this.users = users;
        this.cdr?.markForCheck();
      }),
    );
  }

  addUser() {
    const data = { email: this.email.value };
    this.usersService.inviteToAccount(this.account!.slug, data).subscribe(() => {
      this.toaster.success(this.translate.instant('account.invited_user', { user: this.email.value }));
      this.email.patchValue('');
      this.cdr?.markForCheck();
    });
  }

  changeRole(user: AccountUser, role: AccountRoles): void {
    if (role === 'AMEMBER') {
      this._changeRole(user, role)
        .pipe(switchMap(() => this.updateUsers()))
        .subscribe();
    } else {
      this.modalService
        .openConfirm({
          title: 'account.admin.make_admin',
          description: 'account.admin.warning',
        })
        .onClose.pipe(
          filter((confirm) => !!confirm),
          switchMap((result) => (!!result ? this._changeRole(user, role) : of(null))),
          switchMap(() => this.updateUsers()),
          takeUntil(this.unsubscribeAll),
        )
        .subscribe();
    }
  }

  deleteUserConfirm(user: AccountUser): void {
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
        switchMap(() => this.updateUsers()),
        switchMap(() => this.sdk.nuclia.db.getAccount(this.account!.slug)),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((account) => this.stateService.setAccount(account));
  }

  private _changeRole(user: AccountUser, role: AccountRoles): Observable<void> {
    const users: SetUsersAccount = {
      add: [{ id: user.id, role: role }],
    };
    return this.usersService.setAccountUsers(this.account!.slug, users);
  }

  deleteUser(user: AccountUser): Observable<void> {
    const users: SetUsersAccount = {
      delete: [user.id],
    };
    return this.usersService.setAccountUsers(this.account!.slug, users);
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
