import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of, Subject } from 'rxjs';
import { filter, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { SDKService } from '@flaps/core';
import { Account, AccountRoles, AccountUsersPayload, FullAccountUser } from '@nuclia/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';

@Component({
  selector: 'app-account-users',
  templateUrl: './account-users.component.html',
  styleUrls: ['./account-users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountUsersComponent implements OnDestroy, OnInit {
  account?: Account;
  users?: FullAccountUser[];
  email = new UntypedFormControl([''], [Validators.required, Validators.email]);

  roleTranslations: { [role: string]: string } = {
    AOWNER: 'generic.owner',
    AMEMBER: 'generic.member',
  };

  account$ = this.sdk.currentAccount;
  canAddUsers = this.account$.pipe(
    map((account) => account!.max_users == null || (account!.current_users || 0) < account!.max_users),
  );

  unsubscribeAll = new Subject<void>();

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
          this.account = account!;
        }),
        switchMap(() => this.updateUsers()),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(() => this.cdr?.markForCheck());
  }

  isItMe(userId: string) {
    return this.sdk.nuclia.auth.getJWTUser()?.sub === userId;
  }

  updateUsers(): Observable<FullAccountUser[]> {
    return this.sdk.nuclia.db.getAccountUsers(this.account!.slug).pipe(
      tap((users) => {
        this.users = users;
        this.cdr?.markForCheck();
      }),
    );
  }

  addUser() {
    const data = { email: this.email.value };
    this.sdk.nuclia.db.inviteToAccount(this.account!.slug, data).subscribe(() => {
      this.toaster.success(this.translate.instant('account.invited_user', { user: this.email.value }));
      this.email.patchValue('');
      this.cdr?.markForCheck();
    });
  }

  changeRole(user: FullAccountUser, role: string): void {
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
          switchMap((result) => (!!result ? this._changeRole(user, role as AccountRoles) : of(null))),
          switchMap(() => this.updateUsers()),
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
        switchMap(() => this.updateUsers()),
        switchMap(() => this.sdk.nuclia.db.getAccount(this.account!.slug)),
        takeUntil(this.unsubscribeAll),
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

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
