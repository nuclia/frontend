import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BlockedFeature } from '@nuclia/core';
import { AccountService } from '../../account.service';
import { ManagerStore } from '../../../manager.store';

type BlockedFeaturesForm = Record<BlockedFeature, FormControl<boolean>>;

@Component({
  selector: 'nma-blocked-features',
  templateUrl: './blocked-features.component.html',
  styleUrls: ['./blocked-features.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class BlockedFeaturesComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();
  private blockedFeaturesBackup?: BlockedFeature[];

  blockedFeatures: FormGroup<BlockedFeaturesForm>;
  isSaving = false;

  constructor(
    private store: ManagerStore,
    private accountService: AccountService,
    private cdr: ChangeDetectorRef,
  ) {
    const features = Object.values(BlockedFeature).reduce((controls, feature) => {
      controls[feature] = new FormControl<boolean>(false, { nonNullable: true });
      return controls;
    }, {} as BlockedFeaturesForm);
    this.blockedFeatures = new FormGroup(features);
  }

  ngOnInit(): void {
    this.store.blockedFeatures.pipe(takeUntil(this.unsubscribeAll)).subscribe((blockedFeatures) => {
      this.blockedFeaturesBackup = [...blockedFeatures];
      Object.entries(this.blockedFeatures.controls).forEach(([feature, control]) => {
        control.patchValue(blockedFeatures.includes(<BlockedFeature>feature));
      });
    });
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  save() {
    const accountId = this.store.getAccountId();
    if (this.blockedFeatures.valid && accountId) {
      this.isSaving = true;

      this.accountService.updateBlockedFeatures(accountId, this.blockedFeatures.getRawValue()).subscribe({
        next: () => {
          this.isSaving = false;
          this.blockedFeatures.markAsPristine();
          this.cdr.markForCheck();
        },
        error: () => {
          this.isSaving = false;
          this.cdr.markForCheck();
        },
      });
    }
  }

  reset() {
    if (this.blockedFeaturesBackup) {
      const blockedBackup = this.blockedFeaturesBackup;
      Object.entries(this.blockedFeatures.controls).forEach(([feature, control]) => {
        control.patchValue(blockedBackup.includes(<BlockedFeature>feature));
      });
      this.blockedFeatures.markAsPristine();
    }
  }
}
