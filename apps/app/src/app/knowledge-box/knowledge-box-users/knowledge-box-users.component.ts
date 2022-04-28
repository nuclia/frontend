import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { filter, map } from 'rxjs';
import { KbUser } from '@flaps/core';
import { SDKService, StateService } from '@flaps/auth';
import { SORTED_KB_ROLES, KB_ROLE_TITLES } from '../utils';
import { KnowledgeBoxUsersService } from './knowledge-box-users.service';
import { KBRoles } from '@nuclia/core';
import { AppToasterService } from '../../services/app-toaster.service';

@Component({
  selector: 'app-knowledge-box-users',
  templateUrl: './knowledge-box-users.component.html',
  styleUrls: ['./knowledge-box-users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KnowledgeBoxUsersComponent {
  addForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['', [Validators.required]],
  });

  columns: string[] = ['name', 'role', 'actions'];
  usersKb = this.users.usersKb;
  account = this.state.account.pipe(filter((account) => !!account));
  isAdmin = this.sdk.currentKb.pipe(map((kb) => !!kb.admin));
  canAddUsers = this.account.pipe(
    map((account) => account!.max_users == null || account!.current_users < account!.max_users),
  );

  roles = SORTED_KB_ROLES;
  initialRoles = SORTED_KB_ROLES.filter((role) => role !== 'SOWNER');
  roleTitles = KB_ROLE_TITLES;

  constructor(
    private users: KnowledgeBoxUsersService,
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private state: StateService,
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
    private toaster: AppToasterService,
  ) {}

  isItMe(userId: string) {
    return this.sdk.nuclia.auth.getJWTUser()?.sub === userId;
  }

  addUser() {
    if (this.addForm.invalid) return;
    const data = {
      email: this.addForm.value.email,
      role: this.addForm.value.role,
    };
    this.users
      .inviteUser(data).subscribe(() => {
        this.users.updateUsers();
        this.toaster.success(this.translate.instant('stash.invited_user', { user: this.addForm.value.email }));
        this.addForm.get('email')?.reset();
        this.cdr?.markForCheck();
      });
  }

  changeRole(userId: string, newRole: KBRoles) {
    this.users.changeRole(userId, newRole).subscribe();
  }

  deleteUser(user: KbUser) {
    this.users.deleteUser(user.id).subscribe();
  }
}
