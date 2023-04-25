import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AccountDetailsStore } from '../account-details.store';
import { debounceTime, filter, map, Observable, Subject, switchMap } from 'rxjs';
import { AccountUser, ExtendedAccount } from '../../account.models';
import { AccountService } from '../../account.service';
import { SisToastService } from '@nuclia/sistema';
import { UserService } from '../../../manage-users/user.service';
import { UserSearch } from '../../../manage-users/user.models';

interface ExtendedAccountUser extends AccountUser {
  isManager: boolean;
}

@Component({
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent {
  users: Observable<ExtendedAccountUser[]> = this.store.accountDetails.pipe(
    filter((account) => !!account),
    map((extendedAccount) => {
      const account = extendedAccount as ExtendedAccount;
      return account.users
        .map((user) => ({
          ...user,
          isManager: account.managers.includes(user.id),
        }))
        .sort((a, b) => {
          if (a.isManager && !b.isManager) {
            return -1;
          } else if (!a.isManager && b.isManager) {
            return 1;
          } else {
            return a.name.localeCompare(b.name);
          }
        });
    }),
  );
  hasSeveralManagers = this.users.pipe(map((users) => users.filter((user) => user.isManager).length > 1));

  searchMemberTerm$ = new Subject<string>();
  potentialMembers$ = this.searchMemberTerm$.pipe(
    filter((term) => term.length > 2 || term.length === 0),
    debounceTime(300),
    switchMap((term) => this.userService.searchUser(term)),
  );

  constructor(
    private store: AccountDetailsStore,
    private accountService: AccountService,
    private userService: UserService,
    private toast: SisToastService,
  ) {}

  removeUser(event: MouseEvent | KeyboardEvent, user: AccountUser) {
    event.preventDefault();
    event.stopPropagation();
    this.store
      .getAccount()
      .pipe(
        switchMap((account) =>
          this.accountService
            .removeAccountUser(account.id, user.id)
            .pipe(switchMap(() => this.accountService.getAccount(account.id))),
        ),
      )
      .subscribe({
        next: (updatedAccount) => this.store.setAccountDetails(updatedAccount),
        error: () => this.toast.error('Removing user failed'),
      });
  }

  removeFromManagers(event: MouseEvent | KeyboardEvent, user: ExtendedAccountUser) {
    event.preventDefault();
    event.stopPropagation();
    this.store
      .getAccount()
      .pipe(
        switchMap((account) =>
          this.accountService
            .updateAccountUserType(account.id, user.id, 'member')
            .pipe(switchMap(() => this.accountService.getAccount(account.id))),
        ),
      )
      .subscribe({
        next: (updatedAccount) => this.store.setAccountDetails(updatedAccount),
        error: () => this.toast.error('Updating user permission failed'),
      });
  }

  addToManagers(event: MouseEvent | KeyboardEvent, user: ExtendedAccountUser) {
    event.preventDefault();
    event.stopPropagation();
    this.store
      .getAccount()
      .pipe(
        switchMap((account) =>
          this.accountService
            .updateAccountUserType(account.id, user.id, 'manager')
            .pipe(switchMap(() => this.accountService.getAccount(account.id))),
        ),
      )
      .subscribe({
        next: (updatedAccount) => this.store.setAccountDetails(updatedAccount),
        error: () => this.toast.error('Updating user permission failed'),
      });
  }

  addMember(member: UserSearch) {
    this.store
      .getAccount()
      .pipe(
        switchMap((account) =>
          this.accountService
            .addAccountUser(account.id, member.id)
            .pipe(switchMap(() => this.accountService.getAccount(account.id))),
        ),
      )
      .subscribe({
        next: (updatedAccount) => this.store.setAccountDetails(updatedAccount),
        error: () => this.toast.error('Adding member failed'),
      });
  }
}
