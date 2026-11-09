import { ChangeDetectorRef, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { KBRoles } from '@nuclia/core';
import { UiToastService } from '@nuclia/ui/toast';
import { combineLatest, debounceTime, filter, map, of, Subject, switchMap } from 'rxjs';
import { UserSearch } from '../../../manage-users/user.models';
import { UserService } from '../../../manage-users/user.service';
import { ManagerStore } from '../../../manager.store';
import { AccountDetails, KbDetails, KbSummary, KbUser } from '../../account-ui.models';
import { AccountService } from '../../account.service';
import { getCopyText } from './kb-details.utils';

@Injectable()
export class KbDetailsService {
  private route = inject(ActivatedRoute);
  private accountService = inject(AccountService);
  private userService = inject(UserService);
  private store = inject(ManagerStore);
  private toast = inject(UiToastService);
  // Kludge: the form is patched outside of the signal graph, so the view has to be marked manually
  private cdr = inject(ChangeDetectorRef);

  canEdit = this.store.canEdit;
  canSeeUsers = this.store.canSeeUsers;
  kb = this.store.kbDetails;
  kbForm = new FormGroup({
    slug: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    title: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    zone: new FormControl<string>('', { nonNullable: true }),
    prewarm_enabled: new FormControl<boolean>(false, { nonNullable: true }),
  });
  isSaving = signal(false);
  copied = signal(false);

  memberSearch = signal('');
  private searchMemberTerm$ = new Subject<string>();
  potentialMembers = toSignal(
    this.searchMemberTerm$.pipe(
      filter((term) => term.length > 2 || term.length === 0),
      debounceTime(300),
      switchMap((term) => {
        const accountId = this.store.getAccountId();
        return accountId ? this.userService.searchAccountUser(accountId, term) : of([]);
      }),
    ),
    { initialValue: [] as UserSearch[] },
  );

  private backupKb?: KbDetails;

  constructor() {
    effect(() => {
      const canEdit = this.canEdit();
      untracked(() => {
        const editableControls = [
          this.kbForm.controls.slug,
          this.kbForm.controls.title,
          this.kbForm.controls.prewarm_enabled,
        ];
        editableControls.forEach((control) => (canEdit ? control.enable() : control.disable()));
      });
    });

    combineLatest([
      toObservable(this.store.accountDetails).pipe(
        filter((accountDetails) => !!accountDetails),
        map((accountDetails) => accountDetails as AccountDetails),
      ),
      this.route.params.pipe(
        filter((params) => !!params['kbId'] && !!params['zoneId']),
        map((params) => ({ kbId: params['kbId'] as string, zoneId: params['zoneId'] as string })),
      ),
    ])
      .pipe(
        takeUntilDestroyed(),
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

  save() {
    this.isSaving.set(true);
    if (this.backupKb) {
      this.accountService.updateKb(this.backupKb, this.kbForm.getRawValue()).subscribe({
        next: (updatedKb) => {
          this.backupKb = updatedKb;
          this.isSaving.set(false);
          this.kbForm.markAsPristine();
        },
        error: () => {
          this.isSaving.set(false);
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
    }
  }

  copy(fullInfo: boolean) {
    if (this.backupKb) {
      navigator.clipboard.writeText(getCopyText(this.backupKb, fullInfo));
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1000);
    }
  }

  togglePublish() {
    const kbDetails = this.kb();
    if (kbDetails) {
      this.accountService.publishKb(kbDetails, !kbDetails.published).subscribe(() => {
        this.store.setKbDetails({ ...kbDetails, published: !kbDetails.published });
      });
    }
  }

  onMemberSearch(term: string) {
    this.memberSearch.set(term);
    this.searchMemberTerm$.next(term);
  }

  onMemberSelected(memberId: string | null | undefined) {
    const member = this.potentialMembers().find((candidate) => candidate.id === memberId);
    if (member) {
      this.addMember(member);
      this.memberSearch.set('');
      this.searchMemberTerm$.next('');
    }
  }

  updateUserRole(member: KbUser, newRole: KBRoles) {
    if (this.backupKb) {
      this.accountService.updateKbUser(this.backupKb, member.id, newRole).subscribe({
        error: () => this.toast.error('Updating user role failed'),
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

  private addMember(member: UserSearch) {
    if (this.backupKb) {
      this.accountService.addKbUser(this.backupKb, member.id).subscribe({
        error: () => this.toast.error('Adding user failed'),
      });
    }
  }
}
