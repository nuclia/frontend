import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, debounceTime, filter, map, of, Subject, switchMap } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { AccountService } from '../../account.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SisToastService } from '@nuclia/sistema';
import { KbUser } from '../../global-account.models';
import { KBRoles } from '@nuclia/core';
import { UserService } from '../../../manage-users/user.service';
import { UserSearch } from '../../../manage-users/user.models';
import { ManagerStore } from '../../../manager.store';
import { AccountDetails, KbDetails } from '../../account-ui.models';

@Component({
  templateUrl: './kb-details.component.html',
  styleUrls: ['./kb-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KbDetailsComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();

  kbForm = new FormGroup({
    slug: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    title: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });
  kb$ = this.store.kbDetails;
  isSaving = false;

  searchMemberTerm$ = new Subject<string>();
  potentialMembers$ = this.searchMemberTerm$.pipe(
    filter((term) => term.length > 2 || term.length === 0),
    debounceTime(300),
    switchMap((term) => {
      const accountId = this.store.getAccountId();
      return accountId ? this.userService.searchAccountUser(accountId, term) : of([]);
    }),
  );

  private currentAccountId?: string;
  private backupKb?: KbDetails;

  constructor(
    private route: ActivatedRoute,
    private accountService: AccountService,
    private userService: UserService,
    private store: ManagerStore,
    private toast: SisToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    combineLatest([
      this.store.accountDetails.pipe(
        filter((accountDetails) => !!accountDetails),
        map((accountDetails) => accountDetails as AccountDetails),
      ),
      this.route.params.pipe(
        filter((params) => !!params['kbId']),
        map((params) => params['kbId'] as string),
      ),
    ])
      .pipe(
        switchMap(([account, kbId]) => {
          this.currentAccountId = account.id;
          return this.accountService.loadKb(account.id, kbId);
        }),
      )
      .subscribe((kb) => {
        this.backupKb = kb;
        this.kbForm.patchValue({ title: kb.title, slug: kb.slug });
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  save() {
    this.isSaving = true;
    if (this.backupKb && this.currentAccountId) {
      this.accountService.updateKb(this.currentAccountId, this.backupKb.id, this.kbForm.getRawValue()).subscribe({
        next: (updatedKb) => {
          this.backupKb = updatedKb;
          this.isSaving = false;
          this.kbForm.markAsPristine();
          this.cdr.markForCheck();
        },
        error: () => {
          this.isSaving = false;
          this.cdr.markForCheck();
          this.toast.error('Updating knowledge box failed');
        },
      });
    }
  }

  reset() {
    if (this.backupKb) {
      this.kbForm.patchValue(this.backupKb);
      this.cdr.markForCheck();
    }
  }

  setAsOwner(member: KbUser) {
    this.updateUser(member.id, 'SOWNER');
  }

  setAsContributor(member: KbUser) {
    this.updateUser(member.id, 'SCONTRIBUTOR');
  }

  setAsMember(member: KbUser) {
    this.updateUser(member.id, 'SMEMBER');
  }

  addMember(member: UserSearch) {
    if (this.backupKb && this.currentAccountId) {
      this.accountService.addKbUser(this.currentAccountId, this.backupKb.id, member.id).subscribe({
        error: () => this.toast.error('Adding user failed'),
      });
    }
  }

  removeUser(member: KbUser) {
    if (this.backupKb && this.currentAccountId) {
      this.accountService.removeKbUser(this.currentAccountId, this.backupKb.id, member.id).subscribe({
        error: () => this.toast.error('Removing user failed'),
      });
    }
  }

  private updateUser(userId: string, newRole: KBRoles) {
    if (this.backupKb && this.currentAccountId) {
      this.accountService.updateKbUser(this.currentAccountId, this.backupKb.id, userId, newRole).subscribe({
        error: () => this.toast.error('Updating user role failed'),
      });
    }
  }
}
