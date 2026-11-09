import { KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BlockedFeature } from '@nuclia/core';
import { HlmCheckboxImports } from '@nuclia/ui-spartan/checkbox';
import { HlmFieldImports } from '@nuclia/ui-spartan/field';
import { ManagerStore } from '../../../manager.store';
import { AccountService } from '../../account.service';
import { FormFooterComponent } from '../../form-footer/form-footer.component';
import { FeatureNamePipe } from './feature-name.pipe';

type BlockedFeaturesForm = Record<BlockedFeature, FormControl<boolean>>;

@Component({
  selector: 'nma-blocked-features',
  templateUrl: './blocked-features.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    HlmCheckboxImports,
    HlmFieldImports,
    FormFooterComponent,
    KeyValuePipe,
    FeatureNamePipe,
  ],
})
export class BlockedFeaturesComponent {
  private store = inject(ManagerStore);
  private accountService = inject(AccountService);

  private blockedFeaturesBackup?: BlockedFeature[];

  blockedFeatures: FormGroup<BlockedFeaturesForm>;
  isSaving = signal(false);

  constructor() {
    const features = Object.values(BlockedFeature).reduce((controls, feature) => {
      controls[feature] = new FormControl<boolean>(false, { nonNullable: true });
      return controls;
    }, {} as BlockedFeaturesForm);
    this.blockedFeatures = new FormGroup(features);

    effect(() => {
      const blockedFeatures = this.store.blockedFeatures();
      untracked(() => {
        this.blockedFeaturesBackup = [...blockedFeatures];
        Object.entries(this.blockedFeatures.controls).forEach(([feature, control]) => {
          control.patchValue(blockedFeatures.includes(<BlockedFeature>feature));
        });
      });
    });
  }

  save() {
    const accountId = this.store.getAccountId();
    if (this.blockedFeatures.valid && accountId) {
      this.isSaving.set(true);

      this.accountService.updateBlockedFeatures(accountId, this.blockedFeatures.getRawValue()).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.blockedFeatures.markAsPristine();
        },
        error: () => this.isSaving.set(false),
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
