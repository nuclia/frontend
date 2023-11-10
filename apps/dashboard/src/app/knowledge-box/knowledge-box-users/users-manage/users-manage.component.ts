import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, combineLatest, filter, map, Observable, switchMap } from 'rxjs';
import { SDKService } from '@flaps/core';
import { KB_ROLE_TITLES, SORTED_KB_ROLES } from '../../utils';
import { UsersManageService } from './users-manage.service';
import { FullKbUser, KBRoles } from '@nuclia/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';

type Order = 'role' | 'name';

@Component({
  selector: 'app-users-manage',
  templateUrl: './users-manage.component.html',
  styleUrls: ['./users-manage.component.scss'],
  providers: [UsersManageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersManageComponent {
  addForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['SMEMBER', [Validators.required]],
  });
  order = new BehaviorSubject<Order>('role');
  orderOpen = false;

  usersKb: Observable<FullKbUser[]> = combineLatest([this.users.usersKb, this.order]).pipe(
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
  isAccountManager = this.sdk.currentAccount.pipe(map((account) => account.can_manage_account));
  hasSeveralOwners: Observable<boolean> = this.usersKb.pipe(
    map((users: FullKbUser[]) => users.filter((user) => user.role === 'SOWNER')?.length > 1),
  );
  canAddUsers = this.sdk.currentAccount.pipe(
    map((account) => account.max_users == null || (account.current_users || 0) < account.max_users),
  );

  roles = SORTED_KB_ROLES;
  initialRoles = SORTED_KB_ROLES.filter((role) => role !== 'SOWNER');
  roleTitles = KB_ROLE_TITLES;

  constructor(
    private users: UsersManageService,
    private formBuilder: UntypedFormBuilder,
    private translate: TranslateService,
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
    private toaster: SisToastService,
    private modal: SisModalService,
  ) {}

  addUser() {
    if (this.addForm.invalid) return;
    const data = {
      email: this.addForm.value.email,
      role: this.addForm.value.role,
    };
    this.users.inviteUser(data).subscribe(() => {
      this.users.updateUsers();
      this.toaster.success(this.translate.instant('stash.invited_user', { user: this.addForm.value.email }));
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

  deleteUser(user: FullKbUser) {
    this.modal
      .openConfirm({
        title: 'stash.confirm_delete_user.title',
        description: 'stash.confirm_delete_user.description',
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((result) => !!result),
        switchMap(() => this.users.deleteUser(user.id)),
      )
      .subscribe(() => {
        this.toaster.success('stash.users.user_deleted');
      });
  }
}
