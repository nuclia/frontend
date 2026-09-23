import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NavigationService, SDKService } from '@flaps/core';
import { ModalRef, PaButtonModule, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { WINDOW } from '@ng-web-apis/common';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { InfoCardComponent } from '@nuclia/sistema';
import { map, take } from 'rxjs';

@Component({
  selector: 'app-trial-expired-modal',
  templateUrl: './trial-expired-modal.component.html',
  styleUrl: './trial-expired-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaModalModule, InfoCardComponent, PaButtonModule, TranslatePipe, TranslateModule],
})
export class TrialExpiredModalComponent {
  modal = inject(ModalRef);
  private sdk = inject(SDKService);
  private navigationService = inject(NavigationService);
  private router = inject(Router);
  private window = inject(WINDOW);

  contactSales(): void {
    this.window.open('https://www.progress.com/agentic-rag/contact-us', '_blank', 'noreferrer');
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
