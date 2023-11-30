import { booleanAttribute, ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { Observable } from 'rxjs';
import { OnboardingService } from '../onboarding.service';
import { OnboardingStatus } from '../onboarding.models';

@Component({
  selector: 'nus-onboarding-setting-up',
  standalone: true,
  imports: [CommonModule, TranslateModule, PaIconModule],
  templateUrl: './setting-up.component.html',
  styleUrl: './setting-up.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingUpComponent {
  private onboardingService = inject(OnboardingService);

  @Input({ transform: booleanAttribute }) withDataset = false;
  onboardingStatus: Observable<OnboardingStatus> = this.onboardingService.onboardingState;
}
