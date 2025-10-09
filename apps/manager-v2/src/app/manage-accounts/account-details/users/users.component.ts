import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { debounceTime, filter, map, Subject, switchMap } from 'rxjs';
import { AccountService } from '../../account.service';
import { SisToastService } from '@nuclia/sistema';
import { UserService } from '../../../manage-users/user.service';
import { UserSearch } from '../../../manage-users/user.models';
import { ManagerStore } from '../../../manager.store';
import { AccountDetails, AccountUser } from '../../account-ui.models';
import { takeUntil } from 'rxjs/operators';

@Component({
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class UsersComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();
  private accountId?: string;

  canEdit = this.store.canEdit;
  users = this.store.accountUsers;
  hasSeveralManagers = this.users.pipe(map((users) => users.filter((user) => user.isManager).length > 1));

  searchMemberTerm$ = new Subject<string>();
  potentialMembers$ = this.searchMemberTerm$.pipe(
    filter((term) => term.length > 2 || term.length === 0),
    debounceTime(300),
    switchMap((term) => this.userService.searchUser(term)),
  );

  constructor(
    private store: ManagerStore,
    private accountService: AccountService,
    private userService: UserService,
    private toast: SisToastService,
  ) {}

  ngOnInit() {
    this.store.accountDetails
      .pipe(
        filter((details) => !!details),
        map((details) => details as AccountDetails),
        switchMap((details) => {
          this.accountId = details.id;
          return this.accountService.loadAccountUsers(details.id);
        }),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  addMember(member: UserSearch) {
    if (this.accountId) {
      this.accountService.addAccountUser(this.accountId, member.id).subscribe({
        error: () => this.toast.error('Adding member failed'),
      });
    }
  }

  removeUser(event: MouseEvent | KeyboardEvent, user: AccountUser) {
    event.preventDefault();
    event.stopPropagation();

    if (this.accountId) {
      this.accountService.removeAccountUser(this.accountId, user.id).subscribe({
        error: () => this.toast.error('Removing user failed'),
      });
    }
  }

  addToManagers(event: MouseEvent | KeyboardEvent, user: AccountUser) {
    event.preventDefault();
    event.stopPropagation();
    if (this.accountId) {
      this.accountService.updateAccountUserType(this.accountId, user.id, 'manager').subscribe({
        error: () => this.toast.error('Updating user permission failed'),
      });
    }
  }

  removeFromManagers(event: MouseEvent | KeyboardEvent, user: AccountUser) {
    event.preventDefault();
    event.stopPropagation();
    if (this.accountId) {
      this.accountService.updateAccountUserType(this.accountId, user.id, 'member').subscribe({
        error: () => this.toast.error('Updating user permission failed'),
      });
    }
  }
}
