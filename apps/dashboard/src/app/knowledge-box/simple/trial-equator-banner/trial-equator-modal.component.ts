import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';
import { Router } from '@angular/router';
import { map, take } from 'rxjs';
import { NavigationService, SDKService } from '@flaps/core';

@Component({
  selector: 'app-trial-equator-modal',
  standalone: false,
  templateUrl: './trial-equator-modal.component.html',
  styleUrl: './trial-equator-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrialEquatorModalComponent {
  modal = inject(ModalRef);
  private sdk = inject(SDKService);
  private navigationService = inject(NavigationService);
  private router = inject(Router);

  maybeLater(): void {
    this.modal.close();
  }

  upgradeNow(): void {
    this.sdk.currentAccount
      .pipe(
        take(1),
        map((account) => this.navigationService.getUpgradeUrl(account.slug)),
      )
      .subscribe((upgradeUrl) => {
        this.modal.close();
        this.router.navigate([upgradeUrl]);
      });
  }
}
