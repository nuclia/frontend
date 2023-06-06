import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AccountDetailsStore } from '../account-details.store';
import { AccountTypes } from '@nuclia/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject, switchMap, tap } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AccountPatchPayload, ExtendedAccount } from '../../account.models';
import { AccountService } from '../../account.service';
import { SisToastService } from '@nuclia/sistema';
import { AccountTypeDefaults } from '@flaps/core';

@Component({
  templateUrl: './configuration.component.html',
  styleUrls: ['configuration.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigurationComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();
  private accountBackup?: ExtendedAccount;

  configForm = new FormGroup({
    email: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    type: new FormControl<AccountTypes>('stash-trial', { nonNullable: true, validators: [Validators.required] }),
    kbs: new FormGroup({
      kbs_radio: new FormControl<'limit' | 'unlimited'>('limit', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      max_kbs: new FormControl<number>(0, { nonNullable: true, validators: [Validators.required] }),
    }),
    max_dedicated_processors: new FormControl<number>(0, { nonNullable: true, validators: [Validators.required] }),
    zone: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    trial_expiration_date: new FormControl<string>(''),
  });
  zones = this.store.zones;
  isSaving = false;

  defaultLimits?: AccountTypeDefaults;

  get isTrial() {
    return this.configForm.controls.type.value === 'stash-trial';
  }

  constructor(
    private store: AccountDetailsStore,
    private accountService: AccountService,
    private toast: SisToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.store
      .getAccount()
      .pipe(
        tap((accountDetails) => {
          this.accountBackup = { ...accountDetails };
          this.patchConfigForm(accountDetails);
        }),
        switchMap((accountDetails) => this.accountService.getDefaultLimits(accountDetails.type)),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((defaultLimits) => (this.defaultLimits = defaultLimits));
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  save() {
    if (this.configForm.valid) {
      this.isSaving = true;
      this.store
        .getAccount()
        .pipe(
          switchMap((account) => {
            const rawValue = this.configForm.getRawValue();
            const payload: AccountPatchPayload = {
              ...rawValue,
              trial_expiration_date: rawValue.trial_expiration_date ? rawValue.trial_expiration_date : null,
              kbs: rawValue.kbs.kbs_radio === 'limit' ? rawValue.kbs.max_kbs : -1,
            };
            return this.accountService
              .updateAccount(account.id, payload)
              .pipe(switchMap(() => this.accountService.getAccount(account.id)));
          }),
        )
        .subscribe({
          next: (updatedAccount) => {
            this.store.setAccountDetails(updatedAccount);
            this.accountBackup = { ...updatedAccount };
            this.isSaving = false;
            this.configForm.markAsPristine();
            this.cdr.markForCheck();
          },
          error: () => {
            this.isSaving = false;
            this.cdr.markForCheck();
            this.toast.error('Updating account failed');
          },
        });
    }
  }

  reset() {
    if (this.accountBackup) {
      this.patchConfigForm(this.accountBackup);
      this.configForm.markAsPristine();
    }
  }

  resetMaxKbsToDefault() {
    if (!this.defaultLimits) {
      return;
    }
    this.configForm.controls.kbs.controls.max_kbs.patchValue(this.defaultLimits.max_kbs);
    this.configForm.controls.kbs.markAsDirty();
  }

  toggleAccountType() {
    this.configForm.controls.type.patchValue(
      this.configForm.controls.type.value === 'stash-trial' ? 'stash-enterprise' : 'stash-trial',
    );
    this.configForm.controls.type.markAsDirty();
  }

  private patchConfigForm(accountDetails: ExtendedAccount) {
    this.configForm.patchValue(accountDetails);
    this.configForm.controls.kbs.controls.kbs_radio.patchValue(
      accountDetails.stashes.max_stashes === -1 ? 'unlimited' : 'limit',
    );
    this.configForm.controls.kbs.controls.max_kbs.patchValue(accountDetails.stashes.max_stashes);
  }
}
