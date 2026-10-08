import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { UploadButtonComponent } from '@flaps/common';
import { NavigationService } from '@flaps/core';
import {
  ModalConfig,
  PaButtonModule,
  PaIconModule,
  PaModalModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { BadgeComponent, InfoCardComponent, SisModalService } from '@nuclia/sistema';
import { KbHeaderComponent } from '../kb-header/kb-header.component';
import { OnboardingStep } from './kb-onboarding-state.model';
import { KbOnboardingStateService } from './kb-onboarding-state.service';
import { RestartOnboardingModalComponent } from './restart-onboarding-modal.component';
import { SkipOnboardingModalComponent } from './skip-onboarding-modal.component';

const STEP_ORDER: OnboardingStep[] = ['uploading-data', 'processing-data', 'searching-data'];

@Component({
  selector: 'app-kb-onboarding-header',
  imports: [
    BadgeComponent,
    InfoCardComponent,
    KbHeaderComponent,
    PaButtonModule,
    PaIconModule,
    PaModalModule,
    PaTooltipModule,
    RouterModule,
    TranslatePipe,
    UploadButtonComponent,
  ],
  templateUrl: './kb-onboarding-header.component.html',
  styleUrl: './kb-onboarding-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KbOnboardingHeaderComponent {
  private onboardingService = inject(KbOnboardingStateService);
  private modalService = inject(SisModalService);
  private navigationService = inject(NavigationService);

  state = toSignal(this.onboardingService.onboardingState$, { requireSync: true });
  resourceListUrl = toSignal(this.navigationService.getResourceListUrl());
  searchUrl = toSignal(this.navigationService.getSearchUrl());

  openSkipModal(): void {
    this.modalService.openModal(SkipOnboardingModalComponent, new ModalConfig({ dismissable: true }));
  }

  openRestartModal(): void {
    this.modalService.openModal(RestartOnboardingModalComponent, new ModalConfig({ dismissable: true }));
  }

  /** Routing to Search is treated as the completion of onboarding, so it exits immediately on click. */
  trySearch(): void {
    this.onboardingService.markDone();
  }
  /** Badge colour for each onboarding step, relative to the current step. Memoized per `state()` change. */
  stepBadgeKinds = computed(() => {
    const currentIndex = STEP_ORDER.indexOf(this.state()?.currentStep ?? 'uploading-data');
    return STEP_ORDER.reduce(
      (kinds, step, index) => {
        kinds[step] = index === currentIndex ? 'success' : index < currentIndex ? 'tertiary' : 'neutral';
        return kinds;
      },
      {} as Record<OnboardingStep, 'success' | 'tertiary' | 'neutral'>,
    );
  });
}
