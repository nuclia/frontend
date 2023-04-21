import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { AccountDetailsStore } from '../account-details.store';
import { filter, map, Subject, switchMap } from 'rxjs';
import { ExtendedAccount } from '../../account.models';
import { takeUntil } from 'rxjs/operators';
import { AccountService } from '../../account.service';
import { BlockedFeature } from '@nuclia/core';

@Component({
  templateUrl: './blocked-features.component.html',
  styleUrls: ['./blocked-features.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockedFeaturesComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();
  private accountId = '';
  private accountBackup?: ExtendedAccount;

  blockedFeatures = new FormGroup({
    upload: new FormControl<boolean>(false, { nonNullable: true }),
    processing: new FormControl<boolean>(false, { nonNullable: true }),
    search: new FormControl<boolean>(false, { nonNullable: true }),
    generative: new FormControl<boolean>(false, { nonNullable: true }),
  });
  isSaving = false;

  constructor(private accountStore: AccountDetailsStore, private accountService: AccountService) {}

  ngOnInit(): void {
    this.accountStore.accountDetails
      .pipe(
        filter((data) => !!data),
        map((data) => data as ExtendedAccount),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((accountDetails) => {
        this.accountBackup = { ...accountDetails };
        this.accountId = accountDetails.id;
        accountDetails.blocked_features.forEach((feature) => this.blockedFeatures.controls[feature].patchValue(true));
      });
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  save() {
    if (this.blockedFeatures.valid) {
      this.isSaving = true;

      this.accountService
        .updateBlockedFeatures(this.accountId, this.blockedFeatures.getRawValue())
        .pipe(switchMap(() => this.accountService.getAccount(this.accountId)))
        .subscribe((updatedAccount) => this.accountStore.setAccountDetails(updatedAccount));
    }
  }

  reset() {
    if (this.accountBackup) {
      const blockedBackup = this.accountBackup.blocked_features;
      Object.entries(this.blockedFeatures.controls).forEach(([feature, control]) => {
        control.patchValue(blockedBackup.includes(<BlockedFeature>feature));
      });
      this.blockedFeatures.markAsPristine();
    }
  }
}
