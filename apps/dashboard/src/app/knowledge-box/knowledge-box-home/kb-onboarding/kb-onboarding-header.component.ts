import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import {
  ModalConfig,
  PaButtonModule,
  PaIconModule,
  PaModalModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { InfoCardComponent, SisModalService } from '@nuclia/sistema';
import { KbOnboardingStateService } from './kb-onboarding-state.service';
import { SkipOnboardingModalComponent } from './skip-onboarding-modal.component';
import { RestartOnboardingModalComponent } from './restart-onboarding-modal.component';

@Component({
  selector: 'app-kb-onboarding-header',
  imports: [
    InfoCardComponent,
    PaButtonModule,
    PaIconModule,
    PaModalModule,
    PaTogglesModule,
    PaTooltipModule,
    RouterModule,
    TranslateModule,
  ],
  templateUrl: './kb-onboarding-header.component.html',
  styleUrl: './kb-onboarding-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KbOnboardingHeaderComponent {
  kbUrl = input.required<string>();

  private onboardingService = inject(KbOnboardingStateService);
  private modalService = inject(SisModalService);

  state = toSignal(this.onboardingService.onboardingState$, { requireSync: true });

  openSkipModal(): void {
    this.modalService.openModal(SkipOnboardingModalComponent, new ModalConfig({ dismissable: true }));
  }

  openRestartModal(): void {
    this.modalService.openModal(RestartOnboardingModalComponent, new ModalConfig({ dismissable: true }));
  }
}
