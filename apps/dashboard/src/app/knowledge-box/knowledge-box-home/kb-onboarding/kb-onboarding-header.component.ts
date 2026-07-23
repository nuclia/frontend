import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import {
  ModalConfig,
  PaButtonModule,
  PaIconModule,
  PaModalModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { BadgeComponent, InfoCardComponent, SisModalService } from '@nuclia/sistema';
import { KbHeaderComponent } from '../kb-header/kb-header.component';
import { KbMoreActionsComponent } from '../kb-more-actions/kb-more-actions.component';
import { KbOnboardingStateService } from './kb-onboarding-state.service';
import { OnboardingStep } from './kb-onboarding-state.model';
import { SkipOnboardingModalComponent } from './skip-onboarding-modal.component';
import { RestartOnboardingModalComponent } from './restart-onboarding-modal.component';

const STEP_ORDER: OnboardingStep[] = ['uploading-data', 'processing-data', 'searching-data'];

@Component({
  selector: 'app-kb-onboarding-header',
  imports: [
    BadgeComponent,
    InfoCardComponent,
    KbHeaderComponent,
    KbMoreActionsComponent,
    PaButtonModule,
    PaIconModule,
    PaModalModule,
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
