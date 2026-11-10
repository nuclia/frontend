import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SDKService } from '@flaps/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matAddRound, matDeleteRound } from '@ng-icons/material-icons/round';
import { UiConfirmService } from '@nuclia/ui/confirm-dialog';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { UiInfiniteScroll } from '@nuclia/ui/infinite-scroll';
import { HlmInputImports } from '@nuclia/ui-spartan/input';
import { HlmTableImports } from '@nuclia/ui-spartan/table';
import { filter, switchMap } from 'rxjs';
import { ManagerStore } from '../../manager.store';
import { UserSummary } from '../user.models';
import { UserService } from '../user.service';

@Component({
  templateUrl: './user-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmButtonImports, UiInfiniteScroll, HlmInputImports, HlmTableImports, NgIcon, RouterLink, DatePipe],
  providers: [provideIcons({ matAddRound, matDeleteRound })],
})
export class UserListComponent {
  private sdk = inject(SDKService);
  private userService = inject(UserService);
  private confirmService = inject(UiConfirmService);
  private store = inject(ManagerStore);

  private allUsers = signal<UserSummary[]>([]);
  private lastIndex = signal(100);

  canDelete = this.store.canDelete;
  canCreateUser = this.store.canCreateUser;
  filter = signal('');
  users = computed(() => {
    const filterValue = this.filter();
    const users = filterValue
      ? this.allUsers().filter(
          (user) =>
            (user.name || user.email).includes(filterValue) ||
            user.email.includes(filterValue) ||
            user.id.includes(filterValue),
        )
      : this.allUsers();
    return users.toSorted((a, b) => (a.name || '').localeCompare(b.name || '')).slice(0, this.lastIndex());
  });

  constructor() {
    this.loadUsers();
  }

  onFilterInput(event: Event) {
    this.filter.set((event.target as HTMLInputElement).value);
  }

  onReachAnchor() {
    if (this.lastIndex() < this.allUsers().length) {
      this.lastIndex.update((index) => index + 100);
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
          toast.error(message);
        },
      });
  }

  private loadUsers() {
    this.userService.getUsers().subscribe({
      next: (users) => this.allUsers.set(users),
      error: (error) => {
        // A bug on user deletion API makes us lose our token whenever deleting a user
        // To make it clear, we redirect to logout (otherwise we are in a quite confusing state)
        if (error.status === 403) {
          this.sdk.nuclia.auth.logout();
        } else {
          toast.error('An error occurred while loading user list');
        }
      },
    });
  }
}
