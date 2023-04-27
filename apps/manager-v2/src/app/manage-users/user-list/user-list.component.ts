import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { UserService } from '../user.service';
import { BehaviorSubject, combineLatest, filter, map, Observable, switchMap } from 'rxjs';
import { UserSummary } from '../user.models';
import { Router } from '@angular/router';

@Component({
  templateUrl: './user-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListComponent {
  private _allUsers: BehaviorSubject<UserSummary[]> = new BehaviorSubject<UserSummary[]>([]);

  filter$: BehaviorSubject<string> = new BehaviorSubject<string>('');
  users$: Observable<UserSummary[]> = combineLatest([this._allUsers, this.filter$]).pipe(
    map(([users, filter]) =>
      filter
        ? users.filter((user) => (user.name || user.email).includes(filter) || user.email.includes(filter))
        : users,
    ),
    map((accounts) => accounts.slice(0, 500).sort((a, b) => (a.name || '').localeCompare(b.name || ''))),
  );

  constructor(
    private router: Router,
    private userService: UserService,
    private modalService: SisModalService,
    private toast: SisToastService,
  ) {
    this.loadUsers();
  }

  deleteUser(event: MouseEvent, user: UserSummary) {
    event.preventDefault();
    event.stopPropagation();
    this.modalService
      .openConfirm({
        title: `Are you sure you want to delete "${user.email}"?`,
        description: `You’re about to delete ${user.email}${user.name ? ' (' + user.name + ')' : ''}?`,
        isDestructive: true,
      })
      .onClose.pipe(
        filter((confirm) => confirm),
        switchMap(() => this.userService.deleteUser(user.id)),
      )
      .subscribe({
        next: () => this.loadUsers(),
        error: () => this.toast.error(`User deletion failed`),
      });
  }

  private loadUsers() {
    this.userService.getUsers().subscribe({
      next: (users) => this._allUsers.next(users),
      error: (error) => {
        // A bug on user deletion API makes us lose our token whenever deleting a user
        // To make it clear, we redirect to logout (otherwise we are in a quite confusing state)
        if (error.status === 403) {
          this.router.navigate(['/user/logout']);
        } else {
          this.toast.error('An error occurred while loading user list');
        }
      },
    });
  }
}
