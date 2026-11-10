import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matMoreVertRound, matPersonAddRound, matVerifiedUserRound } from '@ng-icons/material-icons/round';
import { UiOptionWithDescription } from '@nuclia/ui/option-with-description';
import { BrnAutocompleteSearch } from '@spartan-ng/brain/autocomplete';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmAutocompleteImports } from '@nuclia/ui-spartan/autocomplete';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { HlmDropdownMenuImports } from '@nuclia/ui-spartan/dropdown-menu';
import { HlmFieldImports } from '@nuclia/ui-spartan/field';
import { HlmTableImports } from '@nuclia/ui-spartan/table';
import { debounceTime, filter, map, Subject, switchMap, tap } from 'rxjs';
import { UserSearch } from '../../../manage-users/user.models';
import { UserService } from '../../../manage-users/user.service';
import { ManagerStore } from '../../../manager.store';
import { AccountDetails, AccountUser } from '../../account-ui.models';
import { AccountService } from '../../account.service';

@Component({
  templateUrl: './users.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    NgIcon,
    HlmAutocompleteImports,
    HlmButtonImports,
    HlmDropdownMenuImports,
    HlmFieldImports,
    HlmTableImports,
    UiOptionWithDescription,
    AsyncPipe,
  ],
  providers: [provideIcons({ matMoreVertRound, matPersonAddRound, matVerifiedUserRound })],
})
export class UsersComponent {
  private cdr = inject(ChangeDetectorRef);
  private store = inject(ManagerStore);
  private accountService = inject(AccountService);
  private userService = inject(UserService);
  private accountId?: string;
  private potentialMembers: UserSearch[] = [];

  canEdit = this.store.canEdit;
  users = this.store.accountUsers;
  hasSeveralManagers = computed(() => this.users().filter((user) => user.isManager).length > 1);
  private accountDetails$ = toObservable(this.store.accountDetails);

  private autocomplete = viewChild(BrnAutocompleteSearch);
  searchMemberTerm$ = new Subject<string>();
  potentialMembers$ = this.searchMemberTerm$.pipe(
    filter((term) => term.length > 2 || term.length === 0),
    debounceTime(300),
    switchMap((term) => this.userService.searchUser(term)),
    tap((members) => {
      this.potentialMembers = members;
      this.cdr.markForCheck();
    }),
  );

  constructor() {
    this.accountDetails$
      .pipe(
        filter((details) => !!details),
        map((details) => details as AccountDetails),
        switchMap((details) => {
          this.accountId = details.id;
          return this.accountService.loadAccountUsers(details.id);
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  onMemberSearch(term: string) {
    this.searchMemberTerm$.next(term);
  }

  onMemberSelected(memberId: string | null | undefined) {
    const member = this.potentialMembers.find((candidate) => candidate.id === memberId);
    if (member) {
      this.addMember(member);
      // the autocomplete writes the selected id into its input right after emitting, so reset once it is done
      queueMicrotask(() => this.autocomplete()?.resetValue());
    }
  }

  addMember(member: UserSearch) {
    if (this.accountId) {
      this.accountService.addAccountUser(this.accountId, member.id).subscribe({
        error: () => toast.error('Adding member failed'),
      });
    }
  }

  removeUser(user: AccountUser) {
    if (this.accountId) {
      this.accountService.removeAccountUser(this.accountId, user.id).subscribe({
        error: () => toast.error('Removing user failed'),
      });
    }
  }

  addToManagers(user: AccountUser) {
    if (this.accountId) {
      this.accountService.updateAccountUserType(this.accountId, user.id, 'manager').subscribe({
        error: () => toast.error('Updating user permission failed'),
      });
    }
  }

  removeFromManagers(user: AccountUser) {
    if (this.accountId) {
      this.accountService.updateAccountUserType(this.accountId, user.id, 'member').subscribe({
        error: () => toast.error('Updating user permission failed'),
      });
    }
  }
}
