import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AccountTypeDefaults } from '@flaps/core';
import { AccountTypes } from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { filter, map, Subject, switchMap, tap } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { ManagerStore } from '../../../manager.store';
import { AccountConfigurationPayload, AccountDetails } from '../../account-ui.models';
import { AccountService } from '../../account.service';

@Component({
  templateUrl: './configuration.component.html',
  styleUrls: ['configuration.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ConfigurationComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();
  private accountBackup?: AccountDetails;

  canFullyEditAccount = this.store.canFullyEditAccount;
  canEdit = this.store.canEdit;
  configForm = new FormGroup({
    slug: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    created: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    type: new FormControl<AccountTypes>('stash-trial', { nonNullable: true, validators: [Validators.required] }),
    kbs: new FormGroup({
      kbs_radio: new FormControl<'limit' | 'unlimited'>('limit', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      maxKbs: new FormControl<number>(0, { nonNullable: true, validators: [Validators.required] }),
    }),
    arags: new FormGroup({
      arags_radio: new FormControl<'limit' | 'unlimited'>('limit', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      maxArags: new FormControl<number>(0, { nonNullable: true, validators: [Validators.required] }),
    }),
    zone: new FormControl<string>(''),
    trialExpirationDate: new FormControl<string>(''),
  });
  isSaving = false;

  defaultLimits?: AccountTypeDefaults;
  isTrial = false;

  constructor(
    private store: ManagerStore,
    private accountService: AccountService,
    private toast: SisToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.store.accountDetails
      .pipe(
        filter((details) => !!details),
        map((accountDetails) => accountDetails as AccountDetails),
        tap((accountDetails) => {
          this.isTrial = !!accountDetails.trialExpirationDate;
          this.accountBackup = { ...accountDetails };
          this.patchConfigForm(accountDetails);
        }),
        switchMap((accountDetails) => this.accountService.getDefaultLimits(accountDetails.type)),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((defaultLimits) => {
        this.defaultLimits = defaultLimits;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  save() {
    const accountBackup = this.accountBackup;
    if (this.configForm.valid && accountBackup) {
      this.isSaving = true;
      const { trialExpirationDate, kbs, arags, ...rawValue } = this.configForm.getRawValue();
      this.canFullyEditAccount
        .pipe(
          take(1),
          switchMap((canFullyEditAccount) => {
            const payload: Partial<AccountConfigurationPayload> = canFullyEditAccount
              ? {
                  ...rawValue,
                  maxKbs: kbs.kbs_radio === 'limit' ? kbs.maxKbs : -1,
                  maxArags: arags.arags_radio === 'limit' ? arags.maxArags : -1,
                }
              : {
                  trialExpirationDate,
                  type: rawValue.type,
                };
            payload.trialExpirationDate = trialExpirationDate ? trialExpirationDate : null;
            return this.accountService.updateAccount(accountBackup.id, payload);
          }),
        )
        .subscribe({
          next: (updatedAccount) => {
            this.isSaving = false;
            this.accountBackup = { ...updatedAccount };
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
      this.cdr.markForCheck();
    }
  }

  resetMaxKbsToDefault() {
    if (!this.defaultLimits) {
      return;
    }
    this.configForm.controls.kbs.controls.maxKbs.patchValue(this.defaultLimits.max_kbs);
    this.configForm.controls.kbs.markAsDirty();
    this.cdr.markForCheck();
  }
  resetMaxAragsToDefault() {
    if (!this.defaultLimits) {
      return;
    }
    this.configForm.controls.arags.controls.maxArags.patchValue(this.defaultLimits.max_arags);
    this.configForm.controls.arags.markAsDirty();
    this.cdr.markForCheck();
  }

  toggleAccountType(type: AccountTypes) {
    this.configForm.controls.type.patchValue(type);
    this.configForm.controls.type.markAsDirty();
    this.cdr.markForCheck();
  }

  private patchConfigForm(accountDetails: AccountDetails) {
    this.configForm.patchValue(accountDetails);
    this.configForm.controls.kbs.controls.kbs_radio.patchValue(accountDetails.maxKbs === -1 ? 'unlimited' : 'limit');
    this.configForm.controls.kbs.controls.maxKbs.patchValue(accountDetails.maxKbs);
    this.configForm.controls.arags.controls.arags_radio.patchValue(
      accountDetails.maxArags === -1 ? 'unlimited' : 'limit',
    );
    this.configForm.controls.arags.controls.maxArags.patchValue(accountDetails.maxArags);
    this.cdr.markForCheck();
  }
}
