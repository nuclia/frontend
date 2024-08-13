import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, catchError, combineLatest, filter, map, Observable, switchMap, take, tap } from 'rxjs';
import { FeaturesService, SDKService } from '@flaps/core';
import { KB_ROLE_TITLES, SORTED_KB_ROLES } from '../../utils';
import { UsersManageService } from './users-manage.service';
import { FullKbUser, KBRoles, WritableKnowledgeBox } from '@nuclia/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';

type Order = 'role' | 'name';

interface UserRow extends FullKbUser {
  expires?: string;
}

@Component({
  selector: 'app-users-manage',
  templateUrl: './users-manage.component.html',
  styleUrls: ['./users-manage.component.scss'],
  providers: [UsersManageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersManageComponent {
  @Input() set kb(value: WritableKnowledgeBox | undefined) {
    if (value) {
      this.users.setKb(value);
    }
  }

  addForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['SMEMBER', [Validators.required]],
  });
  order = new BehaviorSubject<Order>('role');
  orderOpen = false;

  userRows: Observable<UserRow[]> = combineLatest([
    combineLatest([this.users.usersKb, this.users.invitesKb]).pipe(
      map(([users, invites]) => [...users, ...invites.map((invite) => ({ ...invite, id: invite.email, name: '-' }))]),
    ),
    this.order,
  ]).pipe(
    map(([users, order]) => {
      if (order === 'name') {
        return [...users].sort((a, b) => a.name.localeCompare(b.name));
      } else {
        return [...users].sort((a, b) => {
          const order = this.roles.indexOf(a.role) - this.roles.indexOf(b.role);
          return order === 0 ? a.name.localeCompare(b.name) : order;
        });
      }
    }),
  );
  userCount: Observable<number> = this.users.usersKb.pipe(map((users) => users.length));
  isAccountManager = this.features.isAccountManager;
  hasSeveralOwners: Observable<boolean> = this.users.usersKb.pipe(
    map((users: FullKbUser[]) => users.filter((user) => user.role === 'SOWNER')?.length > 1),
  );
  canAddUsers = this.sdk.currentAccount.pipe(
    map((account) => account.max_users == null || (account.current_users || 0) < account.max_users),
  );

  roles = SORTED_KB_ROLES;
  roleTitles = KB_ROLE_TITLES;

  constructor(
    private users: UsersManageService,
    private formBuilder: UntypedFormBuilder,
    private translate: TranslateService,
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
    private toaster: SisToastService,
    private modal: SisModalService,
    private features: FeaturesService,
  ) {}

  addUser() {
    if (this.addForm.invalid) return;
    const data = {
      email: this.addForm.value.email,
      role: this.addForm.value.role,
    };
    return this.sdk.currentAccount
      .pipe(
        take(1),
        switchMap((account) => this.sdk.nuclia.db.getAccountUsers(account.slug)),
        switchMap((accountUsers) => {
          const user = accountUsers.find((user) => user.email === data.email);
          if (user) {
            return this.users.addUser(user.id, data.role);
          } else {
            return this.users.inviteUser(data).pipe(
              tap(() =>
                this.toaster.success(this.translate.instant('stash.invited_user', { user: this.addForm.value.email })),
              ),
              catchError((error) => {
                if (error?.status === 409) {
                  this.toaster.error(
                    this.translate.instant('kb.users.already-exists', { email: this.addForm.value.email }),
                  );
                }
                throw error;
              }),
            );
          }
        }),
      )
      .subscribe(() => {
        this.addForm.get('email')?.reset();
        this.cdr?.markForCheck();
      });
  }

  changeRole(userId: string, newRole: KBRoles) {
    this.users.changeRole(userId, newRole).subscribe();
  }

  changeOrder(order: Order) {
    this.order.next(order);
  }

  deleteUser(user: UserRow) {
    this.modal
      .openConfirm({
        title: 'stash.confirm_delete_user.title',
        description: 'stash.confirm_delete_user.description',
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((result) => !!result),
        switchMap(() => (user.expires ? this.users.deleteInvite(user.email) : this.users.deleteUser(user.id))),
      )
      .subscribe(() => {
        this.toaster.success('stash.users.user_deleted');
      });
  }
}
