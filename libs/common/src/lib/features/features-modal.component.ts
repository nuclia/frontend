import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ModalRef, PaButtonModule, PaModalModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { FeatureFlagService, Features } from '@flaps/core';
import { map, take } from 'rxjs';

@Component({
  templateUrl: './features-modal.component.html',
  standalone: true,
  imports: [PaModalModule, TranslateModule, CommonModule, PaButtonModule, PaTogglesModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturesModalComponent {
  booleanFeatures = this.featureFlag.getFeatures().pipe(
    map((features) =>
      Object.entries(features)
        .filter(([, value]) => typeof value === 'boolean')
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {} as Features),
    ),
  );
  hasCustomFeatures = Object.keys(this.featureFlag.getCustomFeatures()).length > 0;
  features?: Features;

  constructor(public modal: ModalRef, private featureFlag: FeatureFlagService, private cdr: ChangeDetectorRef) {
    this.booleanFeatures.pipe(take(1)).subscribe((features) => {
      this.features = { ...features };
      this.cdr?.markForCheck();
    });
  }

  save() {
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
