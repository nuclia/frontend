import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { UserService } from '../user.service';
import { BehaviorSubject, combineLatest, filter, map, Observable, switchMap } from 'rxjs';
import { UserSummary } from '../user.models';
import { ManagerStore } from '../../manager.store';
import { SDKService } from '@flaps/core';

@Component({
  templateUrl: './user-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
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
    private modalService: SisModalService,
    private toast: SisToastService,
  ) {
    this.loadUsers();
  }

  onReachAnchor() {
    if (this.lastIndex < this._allUsers.getValue().length) {
      this.lastIndex = this.lastIndex + 100;
    }
  }

  deleteUser(event: MouseEvent, user: UserSummary) {
    event.preventDefault();
    event.stopPropagation();
    this.modalService
      .openConfirm({
        title: `Are you sure you want to delete "${user.email}"?`,
        description: `You’re about to delete ${user.email}${user.name ? ' (' + user.name + ')' : ''}?`,
        isDestructive: true,
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
      })
      .onClose.pipe(
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
