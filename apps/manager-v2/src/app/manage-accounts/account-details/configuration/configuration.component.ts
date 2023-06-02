import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AccountDetailsStore } from '../account-details.store';
import { AccountTypes } from '@nuclia/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject, switchMap } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ExtendedAccount } from '../../account.models';
import { AccountService } from '../../account.service';
import { SisToastService } from '@nuclia/sistema';

@Component({
  templateUrl: './configuration.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigurationComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();
  private accountBackup?: ExtendedAccount;

  configForm = new FormGroup({
    email: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    type: new FormControl<AccountTypes>('stash-trial', { nonNullable: true, validators: [Validators.required] }),
    kbs: new FormControl<number>(0, { nonNullable: true, validators: [Validators.required] }),
    max_dedicated_processors: new FormControl<number>(0, { nonNullable: true, validators: [Validators.required] }),
    zone: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    trial_expiration_date: new FormControl<string>(''),
  });
  zones = this.store.zones;
  isSaving = false;

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
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((accountDetails) => {
        this.accountBackup = { ...accountDetails };
        this.configForm.patchValue(accountDetails);
        this.configForm.controls.kbs.patchValue(accountDetails.stashes.max_stashes);
      });
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
          switchMap((account) =>
            this.accountService
              .updateAccount(account.id, this.configForm.getRawValue())
              .pipe(switchMap(() => this.accountService.getAccount(account.id))),
          ),
        )
        .subscribe({
          next: (updatedAccount) => {
            this.store.setAccountDetails(updatedAccount);
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
      this.configForm.patchValue(this.accountBackup);
      this.configForm.controls.kbs.patchValue(this.accountBackup.stashes.max_stashes);
      this.configForm.markAsPristine();
    }
  }
}
