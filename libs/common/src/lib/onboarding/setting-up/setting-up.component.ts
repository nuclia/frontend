import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { OnboardingStatus } from '../onboarding.models';
import { OnboardingService } from '../onboarding.service';

@Component({
  selector: 'nus-onboarding-setting-up',
  imports: [CommonModule, TranslatePipe, PaIconModule],
  templateUrl: './setting-up.component.html',
  styleUrl: './setting-up.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingUpComponent {
  private onboardingService = inject(OnboardingService);

  onboardingStatus: Observable<OnboardingStatus> = this.onboardingService.onboardingState;
}
