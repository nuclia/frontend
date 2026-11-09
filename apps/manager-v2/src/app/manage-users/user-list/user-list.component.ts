import { AsyncPipe, DatePipe, SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SDKService } from '@flaps/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matAddRound, matDeleteRound } from '@ng-icons/material-icons/round';
import { UiConfirmService } from '@nuclia/ui/confirm-dialog';
import { UiToastService } from '@nuclia/ui/toast';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { UiInfiniteScrollImports } from '@nuclia/ui/infinite-scroll';
import { HlmInputImports } from '@nuclia/ui-spartan/input';
import { HlmTableImports } from '@nuclia/ui-spartan/table';
import { BehaviorSubject, combineLatest, filter, map, Observable, switchMap } from 'rxjs';
import { ManagerStore } from '../../manager.store';
import { UserSummary } from '../user.models';
import { UserService } from '../user.service';

@Component({
  templateUrl: './user-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HlmButtonImports,
    UiInfiniteScrollImports,
    HlmInputImports,
    HlmTableImports,
    NgIcon,
    RouterLink,
    AsyncPipe,
    DatePipe,
    SlicePipe,
  ],
  providers: [provideIcons({ matAddRound, matDeleteRound })],
})
export class UserListComponent {
  private _allUsers: BehaviorSubject<UserSummary[]> = new BehaviorSubject<UserSummary[]>([]);
  private store = inject(ManagerStore);
  canDelete = this.store.canDelete;
  canCreateUser = this.store.canCreateUser;
  filter$: BehaviorSubject<string> = new BehaviorSubject<string>('');
  users$: Observable<UserSummary[]> = combineLatest([this._allUsers, this.filter$]).pipe(
    map(([users, filter]) =>
      filter
        ? users.filter(
            (user) =>
              (user.name || user.email).includes(filter) || user.email.includes(filter) || user.id.includes(filter),
          )
        : users,
    ),
    map((accounts) => accounts.sort((a, b) => (a.name || '').localeCompare(b.name || ''))),
  );

  lastIndex = 100;

  constructor(
    private sdk: SDKService,
    private userService: UserService,
    private confirmService: UiConfirmService,
    private toast: UiToastService,
  ) {
    this.loadUsers();
  }

  onFilterInput(event: Event) {
    this.filter$.next((event.target as HTMLInputElement).value);
  }

  onReachAnchor() {
    if (this.lastIndex < this._allUsers.getValue().length) {
      this.lastIndex = this.lastIndex + 100;
    }
  }

  deleteUser(event: MouseEvent, user: UserSummary) {
    event.preventDefault();
    event.stopPropagation();
    this.confirmService
      .confirm({
        title: `Are you sure you want to delete "${user.email}"?`,
        description: `You’re about to delete ${user.email}${user.name ? ' (' + user.name + ')' : ''}?`,
        isDestructive: true,
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
      })
      .pipe(
        filter((confirm) => !!confirm),
        switchMap(() => this.userService.deleteUser(user.id)),
      )
      .subscribe({
        next: () => this.loadUsers(),
        error: (error) => {
          const message =
            error.status === 409
              ? 'User cannot be deleted, as they are the only owner on some account(s)'
              : 'User deletion failed';
          this.toast.error(message);
        },
      });
  }

  private loadUsers() {
    this.userService.getUsers().subscribe({
      next: (users) => this._allUsers.next(users),
      error: (error) => {
        // A bug on user deletion API makes us lose our token whenever deleting a user
        // To make it clear, we redirect to logout (otherwise we are in a quite confusing state)
        if (error.status === 403) {
          this.sdk.nuclia.auth.logout();
        } else {
          this.toast.error('An error occurred while loading user list');
        }
      },
    });
  }
}
