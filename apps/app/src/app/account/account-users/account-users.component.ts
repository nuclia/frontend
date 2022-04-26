import { Component, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Subject, Observable } from 'rxjs';
import { takeUntil, filter, tap, switchMap, map } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { STFConfirmComponent, ConfirmData } from '@flaps/components';
import { Account, SDKService, StateService } from '@flaps/auth';
import { UsersService, AccountUser, AccountRoles, SetUsersAccount } from '@flaps/core';

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
  email = new FormControl([''], [Validators.required, Validators.email]);
  addedMessage: string = '';

  account$ = this.stateService.account.pipe(filter((account) => !!account));
  canAddUsers = this.account$.pipe(
    map((account) => account!.max_users == null || account!.current_users < account!.max_users),
  );

  unsubscribeAll = new Subject<void>();

  constructor(
    private usersService: UsersService,
    private dialog: MatDialog,
    private stateService: StateService,
    private translate: TranslateService,
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
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
      this.addedMessage = this.translate.instant('account.invited_user', { user: this.email.value });
      this.email.patchValue('');
      this.cdr?.markForCheck();
      setTimeout(() => {
        this.addedMessage = '';
        this.cdr?.markForCheck();
      }, 6000);
    });
  }

  toggleRole(user: AccountUser): void {
    if (user.role === 'AOWNER') {
      this.changeRole(user, 'AMEMBER')
        .pipe(switchMap(() => this.updateUsers()))
        .subscribe();
    } else {
      const data: ConfirmData = {
        title: 'generic.alert',
        message: 'account.admin.warning',
        confirmText: 'account.admin.make_admin',
        minWidthButtons: '110px',
      };
      const dialogRef = this.dialog.open(STFConfirmComponent, {
        width: '420px',
        data: data,
      });
      dialogRef
        .afterClosed()
        .pipe(
          filter((result) => !!result),
          takeUntil(this.unsubscribeAll),
          switchMap(() => this.changeRole(user, 'AOWNER')),
          switchMap(() => this.updateUsers()),
        )
        .subscribe();
    }
  }

  deleteUserConfirm(user: AccountUser): void {
    const data: ConfirmData = {
      title: 'generic.alert',
      message: 'account.delete_user_warning',
      confirmText: 'generic.delete',
      minWidthButtons: '110px',
    };
    const dialogRef = this.dialog.open(STFConfirmComponent, {
      width: '420px',
      data: data,
    });
    dialogRef
      .afterClosed()
      .pipe(
        filter((result) => !!result),
        takeUntil(this.unsubscribeAll),
        switchMap(() => this.deleteUser(user)),
        switchMap(() => this.updateUsers()),
        switchMap(() => this.sdk.nuclia.db.getAccount(this.account!.slug)),
      )
      .subscribe((account) => {
        this.stateService.setAccount(account);
      });
  }

  changeRole(user: AccountUser, role: AccountRoles): Observable<void> {
    const users: SetUsersAccount = {
      add: [{ user: user.id, role: role }],
      delete: [],
    };
    return this.usersService.setAccountUsers(this.account!.slug, users);
  }

  deleteUser(user: AccountUser): Observable<void> {
    const users: SetUsersAccount = {
      add: [],
      delete: [{ user: user.id, role: user.role }],
    };
    return this.usersService.setAccountUsers(this.account!.slug, users);
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
