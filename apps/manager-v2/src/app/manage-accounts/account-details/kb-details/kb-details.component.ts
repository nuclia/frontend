import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, debounceTime, filter, map, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { AccountService } from '../../account.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SisToastService } from '@nuclia/sistema';
import { KBRoles } from '@nuclia/core';
import { UserService } from '../../../manage-users/user.service';
import { UserSearch } from '../../../manage-users/user.models';
import { ManagerStore } from '../../../manager.store';
import { AccountDetails, KbDetails, KbSummary, KbUser } from '../../account-ui.models';

@Component({
  templateUrl: './kb-details.component.html',
  styleUrls: ['./kb-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class KbDetailsComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();

  canEdit = this.store.canEdit;
  canSeeUsers = this.store.canSeeUsers;
  kbForm = new FormGroup({
    slug: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    title: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    zone: new FormControl<string>('', { nonNullable: true }),
  });
  kb$ = this.store.kbDetails;
  isSaving = false;
  copied = false;

  searchMemberTerm$ = new Subject<string>();
  potentialMembers$ = this.searchMemberTerm$.pipe(
    filter((term) => term.length > 2 || term.length === 0),
    debounceTime(300),
    switchMap((term) => {
      const accountId = this.store.getAccountId();
      return accountId ? this.userService.searchAccountUser(accountId, term) : of([]);
    }),
    tap(() => this.cdr.markForCheck()),
  );

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
        filter((params) => !!params['kbId'] && !!params['zoneId']),
        map((params) => ({ kbId: params['kbId'] as string, zoneId: params['zoneId'] as string })),
      ),
    ])
      .pipe(
        takeUntil(this.unsubscribeAll),
        switchMap(([account, { kbId, zoneId }]) =>
          this.accountService.loadKb({
            accountId: account.id,
            zone: { id: zoneId },
            id: kbId,
          } as KbSummary),
        ),
      )
      .subscribe((kb) => {
        this.backupKb = kb;
        this.kbForm.patchValue({ title: kb.title, slug: kb.slug, zone: kb.zone.title });
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  save() {
    this.isSaving = true;
    if (this.backupKb) {
      this.accountService.updateKb(this.backupKb, this.kbForm.getRawValue()).subscribe({
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
      this.kbForm.patchValue({ title: this.backupKb.title, slug: this.backupKb.slug });
      this.kbForm.markAsPristine();
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
    if (this.backupKb) {
      this.accountService.addKbUser(this.backupKb, member.id).subscribe({
        error: () => this.toast.error('Adding user failed'),
      });
    }
  }

  removeUser(member: KbUser) {
    if (this.backupKb) {
      this.accountService.removeKbUser(this.backupKb, member.id).subscribe({
        error: () => this.toast.error('Removing user failed'),
      });
    }
  }

  private updateUser(userId: string, newRole: KBRoles) {
    if (this.backupKb) {
      this.accountService.updateKbUser(this.backupKb, userId, newRole).subscribe({
        error: () => this.toast.error('Updating user role failed'),
      });
    }
  }

  copy(fullInfo: boolean) {
    if (this.backupKb) {
      const text = fullInfo
        ? `Account: ${this.backupKb.accountId}\nZone: ${this.backupKb.zone.slug}\nKB: ${this.backupKb.id}`
        : this.backupKb.id;
      navigator.clipboard.writeText(text);
      this.copied = true;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.copied = false;
        this.cdr.markForCheck();
      }, 1000);
    }
  }
}
