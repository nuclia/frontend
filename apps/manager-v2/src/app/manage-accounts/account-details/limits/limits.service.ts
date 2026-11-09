import { ChangeDetectorRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { AccountTypeDefaults } from '@flaps/core';
import { AccountLimitsPatchPayload } from '@nuclia/core';
import { UiToastService } from '@nuclia/ui/toast';
import { filter, map, switchMap, take, tap } from 'rxjs';
import { ManagerStore } from '../../../manager.store';
import { AccountDetails } from '../../account-ui.models';
import { AccountService } from '../../account.service';
import {
  buildLimitGroup,
  getBulkLimitsPayload,
  getDefaultLimit,
  LimitsGroupKey,
  toLimitFormValue,
  toLimitsFormValue,
  toLimitsPayload,
  UNLIMITED,
} from './limits.utils';

@Injectable()
export class LimitsService {
  private store = inject(ManagerStore);
  private accountService = inject(AccountService);
  private toast = inject(UiToastService);
  // Kludge: the form controls are added outside of the signal graph, so the view has to be marked manually
  private cdr = inject(ChangeDetectorRef);
  private backup?: AccountDetails;
  private defaultLimits?: AccountTypeDefaults;

  canEdit = this.store.canEdit;
  limitsForm = new FormGroup<Record<LimitsGroupKey, FormGroup>>({
    upload: new FormGroup({}),
    usage: new FormGroup({}),
  });
  isSaving = signal(false);

  constructor() {
    toObservable(this.store.accountDetails)
      .pipe(
        filter((accountDetails) => !!accountDetails),
        map((accountDetails) => accountDetails as AccountDetails),
        take(1),
        tap((accountDetails) => {
          this.backup = { ...accountDetails };
          Object.entries(accountDetails.limits?.upload || {}).forEach(([key, limit]) => {
            this.limitsForm.controls.upload.addControl(key, buildLimitGroup(key, limit));
          });
          Object.entries(accountDetails.limits?.usage || {}).forEach(([key, limit]) => {
            this.limitsForm.controls.usage.addControl(key, buildLimitGroup(key, limit));
          });
          this.cdr.markForCheck();
        }),
        switchMap((accountDetails) => this.accountService.getDefaultLimits(accountDetails.type)),
        takeUntilDestroyed(),
      )
      .subscribe((defaultLimits) => (this.defaultLimits = defaultLimits));
  }

  save() {
    if (this.limitsForm.valid) {
      this.isSaving.set(true);
      this.updateLimits(toLimitsPayload(this.limitsForm.getRawValue()));
    }
  }

  cancel() {
    if (this.backup) {
      this.updateForm(this.backup);
    }
  }

  reset(groupKey: string, limitKey: string) {
    if (!this.defaultLimits || (groupKey !== 'usage' && groupKey !== 'upload')) {
      return;
    }
    const defaultValue = getDefaultLimit(this.defaultLimits, limitKey);
    this.limitsForm.controls[groupKey].get(limitKey)?.patchValue(toLimitFormValue(limitKey, defaultValue));
  }

  resetAllToDefault() {
    this.updateLimits(getBulkLimitsPayload(null));
  }

  removeLimits() {
    this.updateLimits(getBulkLimitsPayload(UNLIMITED));
  }

  private updateLimits(limits: AccountLimitsPatchPayload) {
    const accountId = this.store.getAccountId();
    if (accountId) {
      this.isSaving.set(true);
      this.accountService.updateAccountLimits(accountId, limits).subscribe({
        next: (updatedAccount) => {
          this.isSaving.set(false);
          this.backup = { ...updatedAccount };
          this.updateForm(updatedAccount);
        },
        error: () => {
          this.isSaving.set(false);
          this.toast.error('Updating limits failed');
        },
      });
    }
  }

  private updateForm(account: AccountDetails) {
    this.limitsForm.patchValue(toLimitsFormValue(account.limits || {}));
    this.limitsForm.markAsPristine();
  }
}
