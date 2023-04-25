import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AccountDetailsStore } from '../account-details.store';
import { AccountService } from '../../account.service';
import { SisToastService } from '@nuclia/sistema';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject, switchMap } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AccountLimits } from '@nuclia/core';

@Component({
  templateUrl: './limits.component.html',
  styleUrls: ['./limits.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LimitsComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();

  limitsForm = new FormGroup({
    processing: new FormGroup({}),
    upload: new FormGroup({}),
    usage: new FormGroup({}),
  });
  isSaving = false;

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
        Object.entries(accountDetails.limits.processing || {}).forEach(([key, limit]) => {
          this.limitsForm.controls.processing.addControl(
            key,
            new FormControl<number>(limit, { nonNullable: true, validators: [Validators.required] }),
          );
        });
        Object.entries(accountDetails.limits.upload || {}).forEach(([key, limit]) => {
          this.limitsForm.controls.upload.addControl(
            key,
            new FormControl<number>(limit, { nonNullable: true, validators: [Validators.required] }),
          );
        });
        Object.entries(accountDetails.limits.usage || {}).forEach(([key, limit]) => {
          this.limitsForm.controls.usage.addControl(
            key,
            new FormControl<number>(limit, { nonNullable: true, validators: [Validators.required] }),
          );
        });
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  save() {
    if (this.limitsForm.valid) {
      this.isSaving = true;
      this.store
        .getAccount()
        .pipe(
          switchMap((account) =>
            this.accountService
              .updateAccount(account.id, { limits: this.limitsForm.getRawValue() as AccountLimits })
              .pipe(switchMap(() => this.accountService.getAccount(account.id))),
          ),
        )
        .subscribe({
          next: (updatedAccount) => {
            this.store.setAccountDetails(updatedAccount);
            this.isSaving = false;
            this.limitsForm.controls.upload.patchValue(updatedAccount.limits.upload);
            this.limitsForm.controls.usage.patchValue(updatedAccount.limits.usage);
            if (updatedAccount.limits.processing) {
              this.limitsForm.controls.processing.patchValue(updatedAccount.limits.processing);
            }
            this.limitsForm.markAsPristine();
            this.cdr.markForCheck();
          },
          error: () => {
            this.isSaving = false;
            this.cdr.markForCheck();
            this.toast.error('Updating limits failed');
          },
        });
    }
  }

  reset() {
    this.limitsForm.reset();
  }
}
