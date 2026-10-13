import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ModalRef, PaButtonModule, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { KbOnboardingStateService } from './kb-onboarding-state.service';

@Component({
  imports: [PaButtonModule, PaModalModule, TranslatePipe],
  templateUrl: './restart-onboarding-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestartOnboardingModalComponent {
  modal = inject(ModalRef);

  private onboardingService = inject(KbOnboardingStateService);

  confirmRestart(): void {
    this.onboardingService.restart();
    this.modal.close();
  }
}
