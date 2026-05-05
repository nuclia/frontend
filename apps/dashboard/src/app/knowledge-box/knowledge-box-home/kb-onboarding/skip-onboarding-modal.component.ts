import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ModalRef, PaButtonModule, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { KbOnboardingStateService } from './kb-onboarding-state.service';

@Component({
  imports: [PaButtonModule, PaModalModule, TranslateModule],
  templateUrl: './skip-onboarding-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkipOnboardingModalComponent {
  modal = inject(ModalRef);

  private onboardingService = inject(KbOnboardingStateService);

  confirmSkip(): void {
    this.onboardingService.skip();
    this.modal.close();
  }
}
