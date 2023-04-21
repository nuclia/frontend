import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AccountDetailsStore } from '../account-details.store';
import { AccountTypes } from '@nuclia/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { filter, map, Subject, switchMap } from 'rxjs';
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
  private accountId = '';
  private accountBackup?: ExtendedAccount;

  configForm = new FormGroup({
    email: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    type: new FormControl<AccountTypes>('stash-trial', { nonNullable: true, validators: [Validators.required] }),
    kbs: new FormControl<number>(0, { nonNullable: true, validators: [Validators.required] }),
    indexer_slow_replicas: new FormControl<number>(0, { nonNullable: true, validators: [Validators.required] }),
    zone: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });
  zones = this.accountStore.zones;
  isSaving = false;

  constructor(
    private accountStore: AccountDetailsStore,
    private accountService: AccountService,
    private toast: SisToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.accountStore.accountDetails
      .pipe(
        filter((data) => !!data),
        map((data) => data as ExtendedAccount),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((accountDetails) => {
        this.accountBackup = { ...accountDetails };
        this.configForm.patchValue(accountDetails);
        this.configForm.controls.kbs.patchValue(accountDetails.stashes.max_stashes);
        this.accountId = accountDetails.id;
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  save() {
    if (this.configForm.valid) {
      this.isSaving = true;
      this.accountService
        .updateAccount(this.accountId, this.configForm.getRawValue())
        .pipe(switchMap(() => this.accountService.getAccount(this.accountId)))
        .subscribe({
          next: (updatedAccount) => {
            this.accountStore.setAccountDetails(updatedAccount);
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
