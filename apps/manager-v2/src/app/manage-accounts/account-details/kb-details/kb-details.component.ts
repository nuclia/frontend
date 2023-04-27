import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, debounceTime, filter, forkJoin, map, Subject, switchMap } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { AccountService } from '../../account.service';
import { AccountDetailsStore } from '../account-details.store';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SisToastService } from '@nuclia/sistema';
import { KbUser } from '../../account.models';
import { KBRoles } from '@nuclia/core';
import { UserService } from '../../../manage-users/user.service';
import { UserSearch } from '../../../manage-users/user.models';

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
  potentialMembers$ = combineLatest([
    this.searchMemberTerm$.pipe(
      filter((term) => term.length > 2 || term.length === 0),
      debounceTime(300),
    ),
    this.store.getAccount(),
  ]).pipe(switchMap(([term, account]) => this.userService.searchAccountUser(account.id, term)));

  constructor(
    private route: ActivatedRoute,
    private accountService: AccountService,
    private userService: UserService,
    private store: AccountDetailsStore,
    private toast: SisToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    combineLatest([
      this.store.getAccount(),
      this.route.params.pipe(
        filter((params) => !!params['kbId']),
        map((params) => params['kbId'] as string),
      ),
    ])
      .pipe(switchMap(([account, kbId]) => this.accountService.getKb(account.id, kbId)))
      .subscribe((kb) => {
        this.store.setKbDetails(kb);
        this.kbForm.patchValue({ title: kb.title, slug: kb.slug });
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  save() {
    this.isSaving = true;
    forkJoin([this.store.getAccount(), this.store.getKb()])
      .pipe(
        switchMap(([account, kb]) =>
          this.accountService
            .updateKb(account.id, kb.id, this.kbForm.getRawValue())
            .pipe(switchMap(() => this.accountService.getKb(account.id, kb.id))),
        ),
      )
      .subscribe({
        next: (updatedKb) => {
          this.store.setKbDetails(updatedKb);
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

  reset() {
    this.store.getKb().subscribe((kb) => {
      this.kbForm.patchValue({ title: kb.title, slug: kb.slug });
      this.kbForm.markAsPristine();
    });
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

  removeUser(member: KbUser) {
    forkJoin([this.store.getAccount(), this.store.getKb()])
      .pipe(
        switchMap(([account, kb]) =>
          this.accountService
            .removeKbUser(account.id, kb.id, member.id)
            .pipe(switchMap(() => this.accountService.getKb(account.id, kb.id))),
        ),
      )
      .subscribe({
        next: (updatedKb) => {
          this.store.setKbDetails(updatedKb);
          this.kbForm.markAsPristine();
          this.cdr.markForCheck();
        },
        error: () => {
          this.cdr.markForCheck();
          this.toast.error('Removing user failed');
        },
      });
  }

  addMember(member: UserSearch) {
    forkJoin([this.store.getAccount(), this.store.getKb()])
      .pipe(
        switchMap(([account, kb]) =>
          this.accountService
            .addKbUser(account.id, kb.id, member.id)
            .pipe(switchMap(() => this.accountService.getKb(account.id, kb.id))),
        ),
      )
      .subscribe({
        next: (updatedKb) => {
          this.store.setKbDetails(updatedKb);
          this.kbForm.markAsPristine();
          this.cdr.markForCheck();
        },
        error: () => {
          this.cdr.markForCheck();
          this.toast.error('Adding user failed');
        },
      });
  }

  private updateUser(userId: string, newRole: KBRoles) {
    forkJoin([this.store.getAccount(), this.store.getKb()])
      .pipe(
        switchMap(([account, kb]) =>
          this.accountService
            .updateKbUser(account.id, kb.id, userId, newRole)
            .pipe(switchMap(() => this.accountService.getKb(account.id, kb.id))),
        ),
      )
      .subscribe({
        next: (updatedKb) => {
          this.store.setKbDetails(updatedKb);
          this.kbForm.markAsPristine();
          this.cdr.markForCheck();
        },
        error: () => {
          this.cdr.markForCheck();
          this.toast.error('Updating user role failed');
        },
      });
  }
}
