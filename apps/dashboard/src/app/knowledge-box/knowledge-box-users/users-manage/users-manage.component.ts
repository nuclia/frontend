import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Input } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { filter, map } from 'rxjs';
import { KbUser } from '@flaps/core';
import { StateService } from '@flaps/core';
import { SORTED_KB_ROLES, KB_ROLE_TITLES } from '../../utils';
import { UsersManageService } from './users-manage.service';
import { KBRoles } from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';

@Component({
  selector: 'app-users-manage',
  templateUrl: './users-manage.component.html',
  styleUrls: ['./users-manage.component.scss'],
  providers: [UsersManageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersManageComponent {
  private _kb?: string;
  @Input()
  get kb(): string | undefined {
    return this._kb;
  }
  set kb(value: string | undefined) {
    this._kb = value;
    if (value) {
      this.users.updateUsers(value);
    }
  }
  @Input() modal: boolean = false;

  addForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['', [Validators.required]],
  });

  columns: string[] = ['name', 'role', 'actions'];
  usersKb = this.users.usersKb;
  account = this.state.account.pipe(filter((account) => !!account));
  isAccountManager = this.account.pipe(
    filter((account) => !!account),
    map((account) => account!.can_manage_account),
  );
  canAddUsers = this.account.pipe(
    map((account) => account!.max_users == null || account!.current_users < account!.max_users),
  );

  roles = SORTED_KB_ROLES;
  initialRoles = SORTED_KB_ROLES.filter((role) => role !== 'SOWNER');
  roleTitles = KB_ROLE_TITLES;

  constructor(
    private users: UsersManageService,
    private formBuilder: UntypedFormBuilder,
    private translate: TranslateService,
    private state: StateService,
    private cdr: ChangeDetectorRef,
    private toaster: SisToastService,
  ) {}

  addUser() {
    if (this.addForm.invalid) return;
    const data = {
      email: this.addForm.value.email,
      role: this.addForm.value.role,
    };
    this.users.inviteUser(this.kb!, data).subscribe(() => {
      this.users.updateUsers(this.kb!);
      this.toaster.success(this.translate.instant('stash.invited_user', { user: this.addForm.value.email }));
      this.addForm.get('email')?.reset();
      this.cdr?.markForCheck();
    });
  }

  changeRole(userId: string, newRole: KBRoles) {
    this.users.changeRole(this.kb!, userId, newRole).subscribe();
  }

  deleteUser(user: KbUser) {
    this.users.deleteUser(this.kb!, user.id).subscribe();
  }
}
