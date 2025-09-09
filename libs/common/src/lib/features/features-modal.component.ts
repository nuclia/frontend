import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ModalRef, PaButtonModule, PaModalModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { FeatureFlagService, Features } from '@flaps/core';
import { map, take } from 'rxjs';

@Component({
  templateUrl: './features-modal.component.html',
  imports: [PaModalModule, TranslateModule, CommonModule, PaButtonModule, PaTogglesModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturesModalComponent {
  hasCustomFeatures = Object.keys(this.featureFlag.getCustomFeatures()).length > 0;
  features?: Features;
  showBlockedZones = this.featureFlag.showBlockedZones();

  constructor(
    public modal: ModalRef,
    private featureFlag: FeatureFlagService,
    private cdr: ChangeDetectorRef,
  ) {
    this.featureFlag
      .getDisabledFeatures()
      .pipe(take(1))
      .subscribe((features) => {
        this.features = { ...features };
        this.cdr?.markForCheck();
      });
  }

  save() {
    this.featureFlag.changeBlockedZones(this.showBlockedZones);
    this.featureFlag
      .getDefaultFeatures()
      .pipe(
        map((defaults) =>
          Object.entries(this.features || {})
            .filter(([key, value]) => defaults[key] !== value)
            .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {} as Features),
        ),
      )
      .subscribe((features) => {
        this.featureFlag.setCustomFeatures(features);
        window.location.reload();
      });
  }

  reset() {
    this.featureFlag.setCustomFeatures({});
    window.location.reload();
  }
}
