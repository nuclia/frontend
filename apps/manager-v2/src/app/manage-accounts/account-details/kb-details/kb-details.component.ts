import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  matCheckRound,
  matContentCopyRound,
  matMoreVertRound,
  matPersonAddRound,
} from '@ng-icons/material-icons/round';
import { KBRoles } from '@nuclia/core';
import { UiOptionWithDescriptionImports } from '@nuclia/ui/option-with-description';
import { UiToastService } from '@nuclia/ui/toast';
import { HlmAutocompleteImports } from '@nuclia/ui-spartan/autocomplete';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { HlmDropdownMenuImports } from '@nuclia/ui-spartan/dropdown-menu';
import { HlmFieldImports } from '@nuclia/ui-spartan/field';
import { HlmInputImports } from '@nuclia/ui-spartan/input';
import { HlmSwitchImports } from '@nuclia/ui-spartan/switch';
import { HlmTableImports } from '@nuclia/ui-spartan/table';
import { combineLatest, debounceTime, filter, map, of, Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import { UserSearch } from '../../../manage-users/user.models';
import { UserService } from '../../../manage-users/user.service';
import { ManagerStore } from '../../../manager.store';
import { AccountDetails, KbDetails, KbSummary, KbUser } from '../../account-ui.models';
import { AccountService } from '../../account.service';
import { FormFooterComponent } from '../../form-footer/form-footer.component';

@Component({
  templateUrl: './kb-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    HlmAutocompleteImports,
    HlmButtonImports,
    HlmDropdownMenuImports,
    HlmFieldImports,
    HlmInputImports,
    HlmSwitchImports,
    HlmTableImports,
    NgIcon,
    UiOptionWithDescriptionImports,
    FormFooterComponent,
    AsyncPipe,
  ],
  providers: [provideIcons({ matCheckRound, matContentCopyRound, matMoreVertRound, matPersonAddRound })],
})
export class KbDetailsComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();
  private manager = inject(ManagerStore);

  canEdit = this.store.canEdit;
  canSeeUsers = this.store.canSeeUsers;
  kbForm = new FormGroup({
    slug: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    title: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    zone: new FormControl<string>('', { nonNullable: true }),
    prewarm_enabled: new FormControl<boolean>(false, { nonNullable: true }),
  });
  kb$ = this.store.kbDetails;
  isSaving = false;
  copied = false;

  memberSearch = '';
  searchMemberTerm$ = new Subject<string>();
  potentialMembers$ = this.searchMemberTerm$.pipe(
    filter((term) => term.length > 2 || term.length === 0),
    debounceTime(300),
    switchMap((term) => {
      const accountId = this.store.getAccountId();
      return accountId ? this.userService.searchAccountUser(accountId, term) : of([]);
    }),
    tap((members) => {
      this.potentialMembers = members;
      this.cdr.markForCheck();
    }),
  );
  private potentialMembers: UserSearch[] = [];

  private backupKb?: KbDetails;

  constructor(
    private route: ActivatedRoute,
    private accountService: AccountService,
    private userService: UserService,
    private store: ManagerStore,
    private toast: UiToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.canEdit.pipe(takeUntil(this.unsubscribeAll)).subscribe((canEdit) => {
      const editableControls = [
        this.kbForm.controls.slug,
        this.kbForm.controls.title,
        this.kbForm.controls.prewarm_enabled,
      ];
      editableControls.forEach((control) => (canEdit ? control.enable() : control.disable()));
      this.cdr.markForCheck();
    });

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
        this.kbForm.patchValue({
          title: kb.title,
          slug: kb.slug,
          zone: kb.zone.title,
          prewarm_enabled: kb.prewarm_enabled ?? false,
        });
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
      this.kbForm.patchValue({
        title: this.backupKb.title,
        slug: this.backupKb.slug,
        prewarm_enabled: this.backupKb.prewarm_enabled ?? false,
      });
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

  onMemberSearch(term: string) {
    this.memberSearch = term;
    this.searchMemberTerm$.next(term);
  }

  onMemberSelected(memberId: string | null | undefined) {
    const member = this.potentialMembers.find((candidate) => candidate.id === memberId);
    if (member) {
      this.addMember(member);
      this.memberSearch = '';
      this.searchMemberTerm$.next('');
    }
  }

  userRows(kb: KbDetails): { user: KbUser; role: 'owner' | 'contributor' | 'member' }[] {
    return [
      ...kb.owners.map((user) => ({ user, role: 'owner' as const })),
      ...kb.contributors.map((user) => ({ user, role: 'contributor' as const })),
      ...kb.members.map((user) => ({ user, role: 'member' as const })),
    ];
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

  togglePublish() {
    this.kb$
      .pipe(
        filter((details) => !!details),
        take(1),
        switchMap((kbDetails) =>
          this.accountService
            .publishKb(kbDetails, !kbDetails.published)
            .pipe(tap(() => this.manager.setKbDetails({ ...kbDetails, published: !kbDetails.published }))),
        ),
      )
      .subscribe();
  }
}
