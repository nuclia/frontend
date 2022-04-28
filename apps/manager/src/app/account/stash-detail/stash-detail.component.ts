import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserSearch } from '../../models/user.model';
import { AccountService } from '../../services/account.service';
import { UsersService } from '../../services/users.service';
import { Account } from '../../models/account.model';
import { StashRoles, ManagerStash, StashAddUser } from '../../models/stash.model';

@Component({
  selector: 'app-stash-detail',
  templateUrl: './stash-detail.component.html',
  styleUrls: ['./stash-detail.component.scss'],
})
export class StashDetailComponent implements OnInit {
  account: Account | undefined;
  stash: ManagerStash | undefined;
  searchUser: string = '';

  userSearchList: UserSearch[] = [];
  searchUserForm = this.fb.group({
    user: this.fb.control(''),
    email: this.fb.control(''),
  });

  stashTitle = this.fb.group({
    title: this.fb.control(''),
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private accountService: AccountService,
    private userService: UsersService
  ) {}

  saveTitle() {
    if (this.stashTitle.valid && this.account && this.stash) {
      this.accountService
        .editStash(this.account.id, this.stash.id, { title: this.stashTitle.controls.title.value })
        .subscribe(res => this.refresh());
    }
  }
  goAccount() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  ngOnInit(): void {
    this.route.parent?.data.subscribe((data: { [account:string]: Account | null }) => {
      if (data.account) {
        this.account = data.account;
      }
    });
    this.route.data.subscribe((data: { [account:string]: ManagerStash | null }) => {
      if (data.stash) {
        this.stash = data.stash;
      }
    });
  }
  refresh() {
    if (this.account && this.stash) {
      this.accountService.getStash(this.account.id, this.stash.id).subscribe((res) => (this.stash = res));
    }
  }

  addSeachedUser(userId: string) {
    if (this.account && this.stash) {
      const user: StashAddUser = {
        user: userId,
        stash: this.stash.id,
      }
      this.accountService.addStashUser(this.account.id, this.stash.id, user).subscribe((res: any) => this.refresh());
    }
  }
  search() {
    if (this.account) {
      this.userService.searchAccountUser(this.account.id, this.searchUser).subscribe((users: UserSearch[]) => {
        this.userSearchList = users;
      });
    }
  }

  searching(value: string) {
    this.searchUser = value;
  }

  remove(userid: string) {
    if (this.account && this.stash) {
      this.accountService.delStashUser(this.account.id, this.stash.id, userid).subscribe((res: any) => this.refresh());
    }
  }

  updateToOwner(userId: string) {
    this.updateTo(userId, 'SOWNER');
  }

  updateToContributor(userId: string) {
    this.updateTo(userId, 'SCONTRIBUTOR');
  }

  updateToMember(userId: string) {
    this.updateTo(userId, 'SMEMBER');
  }

  updateTo(userId: string, permission: StashRoles) {
    if (this.account && this.stash) {
      this.accountService
        .setStashUser(this.account.id, this.stash.id, userId, { type: permission })
        .subscribe((res: any) => this.refresh());
    }
  }
}
