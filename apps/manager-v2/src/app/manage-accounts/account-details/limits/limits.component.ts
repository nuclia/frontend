import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AccountDetailsStore } from '../account-details.store';
import { AccountService } from '../../account.service';
import { SisToastService } from '@nuclia/sistema';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject, switchMap, tap } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AccountLimitsPatchPayload } from '@nuclia/core';
import { ExtendedAccount } from '../../account.models';
import { AccountTypeDefaults } from '@flaps/core';

@Component({
  templateUrl: './limits.component.html',
  styleUrls: ['./limits.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LimitsComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();

  limitsForm = new FormGroup({
    upload: new FormGroup({}),
    usage: new FormGroup({}),
  });
  isSaving = false;

  defaultLimits?: AccountTypeDefaults;

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
          Object.entries(accountDetails.limits.upload).forEach(([key, limit]) => {
            const radioKey = `${key}-radio`;
            this.limitsForm.controls.upload.addControl(
              key,
              new FormGroup({
                [radioKey]: new FormControl<'limit' | 'unlimited'>(limit === -1 ? 'unlimited' : 'limit', {
                  nonNullable: true,
                  validators: [Validators.required],
                }),
                limit: new FormControl<number>(limit, { validators: [Validators.required] }),
              }),
            );
          });
          Object.entries(accountDetails.limits.usage).forEach(([key, limit]) => {
            this.limitsForm.controls.usage.addControl(
              key,
              new FormGroup({
                [`${key}-radio`]: new FormControl<'limit' | 'unlimited'>(limit === -1 ? 'unlimited' : 'limit', {
                  nonNullable: true,
                  validators: [Validators.required],
                }),
                limit: new FormControl<number>(limit, { validators: [Validators.required] }),
              }),
            );
          });
          this.cdr.markForCheck();
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

  getRadioValue(groupKey: string, limitKey: string): 'limit' | 'unlimited' {
    return groupKey === 'upload'
      ? this.limitsForm.controls.upload.get(limitKey)?.get(`${limitKey}-radio`)?.value
      : this.limitsForm.controls.usage.get(limitKey)?.get(`${limitKey}-radio`)?.value;
  }

  save() {
    if (this.limitsForm.valid) {
      this.isSaving = true;
      const rawValues = this.limitsForm.getRawValue();
      const payload: AccountLimitsPatchPayload = Object.entries(rawValues).reduce((data, [groupKey, limits]) => {
        data[groupKey as 'usage' | 'upload'] = Object.entries(limits).reduce((value, [key, limitData]) => {
          const limitAndRadio = limitData as any;
          value[key] = limitAndRadio[key + '-radio'] === 'unlimited' ? -1 : (limitAndRadio['limit'] as number);
          return value;
        }, {} as { [key: string]: number }) as any;
        return data;
      }, {} as AccountLimitsPatchPayload);
      this.updateLimits(payload);
    }
  }

  cancel() {
    this.store.getAccount().subscribe((account) => this.updateForm(account));
  }

  reset(groupKey: string, limitKey: string) {
    if (!this.defaultLimits || (groupKey !== 'usage' && groupKey !== 'upload')) {
      return;
    }
    const defaultValue = (this.defaultLimits as any)[limitKey] as number;
    const defaultLimit = {
      limit: defaultValue,
      [limitKey + '-radio']: defaultValue === -1 ? 'unlimited' : 'limit',
    };
    (this.limitsForm.controls[groupKey] as FormGroup).get(limitKey)?.patchValue(defaultLimit);
  }

  resetAllToDefault() {
    const resetPayload = this.getLimitPayload(null);
    this.updateLimits(resetPayload);
  }

  removeLimits() {
    const noLimitPayload = this.getLimitPayload(-1);
    this.updateLimits(noLimitPayload);
  }

  private getLimitPayload(value: -1 | null) {
    const resetPayload: AccountLimitsPatchPayload = {
      upload: {
        upload_limit_max_media_file_size: value,
        upload_limit_max_non_media_file_size: value,
      },
      usage: {
        monthly_limit_docs_no_media_processed: value,
        monthly_limit_hosted_answers_generated: value,
        monthly_limit_hosted_searches_performed: value,
        monthly_limit_media_seconds_processed: value,
        monthly_limit_paragraphs_processed: value,
        monthly_limit_paragraphs_stored: value,
        monthly_limit_self_hosted_answers_generated: value,
        monthly_limit_self_hosted_searches_performed: value,
      },
    };
    return resetPayload;
  }

  private updateLimits(payload: AccountLimitsPatchPayload) {
    this.isSaving = true;
    this.store
      .getAccount()
      .pipe(
        switchMap((account) =>
          this.accountService
            .updateAccount(account.id, { limits: payload })
            .pipe(switchMap(() => this.accountService.getAccount(account.id))),
        ),
      )
      .subscribe({
        next: (updatedAccount: ExtendedAccount) => {
          this.store.setAccountDetails(updatedAccount);
          this.isSaving = false;
          this.updateForm(updatedAccount);
        },
        error: () => {
          this.isSaving = false;
          this.cdr.markForCheck();
          this.toast.error('Updating limits failed');
        },
      });
  }

  private updateForm(updatedAccount: ExtendedAccount) {
    const newLimits = Object.entries(updatedAccount.limits).reduce((data, [groupKey, limits]) => {
      data[groupKey] = Object.entries(limits as { [limitKey: string]: number }).reduce((values, [key, limit]) => {
        values[key] = {
          limit,
          [`${key}-radio`]: limit === -1 ? 'unlimited' : 'limit',
        };
        return values;
      }, {} as any);
      return data;
    }, {} as any);
    this.limitsForm.patchValue(newLimits);
    this.limitsForm.markAsPristine();
    this.cdr.markForCheck();
  }
}
