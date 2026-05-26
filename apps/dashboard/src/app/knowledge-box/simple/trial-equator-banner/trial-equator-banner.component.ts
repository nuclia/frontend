import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { SDKService } from '@flaps/core';
import { SisModalService } from '@nuclia/sistema';
import { ModalConfig } from '@guillotinaweb/pastanaga-angular';
import { TrialEquatorModalComponent } from './trial-equator-modal.component';
import { getCoworkTrialState } from '../simple.utils';

@Component({
  standalone: false,
  selector: 'app-trial-equator-banner',
  templateUrl: './trial-equator-banner.component.html',
  styleUrl: './trial-equator-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrialEquatorBannerComponent {
  private sdk = inject(SDKService);
  private modalService = inject(SisModalService);

  private trialState = toSignal(this.sdk.currentAccount.pipe(map(getCoworkTrialState)), {
    initialValue: { isCoworkTrial: false, isTrialExpired: false, isAtEquator: false, daysLeft: 0 },
  });

  isAtEquator = computed(() => this.trialState().isAtEquator);
  daysLeft = computed(() => this.trialState().daysLeft);

  onBannerClick(): void {
    this.modalService.openModal(TrialEquatorModalComponent, new ModalConfig({ data: { daysLeft: this.daysLeft() } }));
  }
}
