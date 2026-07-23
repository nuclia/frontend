import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { PaButtonModule, PaDropdownModule, PaPopupModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { NavigationService, SDKService } from '@flaps/core';
import { SisModalService } from '@nuclia/sistema';
import { combineLatest, map } from 'rxjs';
import { DeveloperIntegrationsModalComponent } from '../developer-integrations-modal/developer-integrations-modal.component';
import { TestPageModalComponent } from '../test-page-modal/test-page-modal.component';

/**
 * "More actions" menu (KB settings / developer integrations / test page), shown identically in
 * both the onboarding header and the done-state kb-header. Defined once and self-sufficient so
 * it can be dropped anywhere without prop-drilling.
 */
@Component({
  selector: 'app-kb-more-actions',
  imports: [PaButtonModule, PaDropdownModule, PaPopupModule, RouterModule, TranslateModule],
  templateUrl: './kb-more-actions.component.html',
  styleUrl: './kb-more-actions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KbMoreActionsComponent {
  private sdk = inject(SDKService);
  private navigationService = inject(NavigationService);
  private modalService = inject(SisModalService);

  kbUrl = toSignal(
    combineLatest([this.sdk.currentAccount, this.sdk.currentKb]).pipe(
      map(([account, kb]) => {
        const kbSlug = (this.sdk.nuclia.options.standalone ? kb.id : kb.slug) as string;
        return this.navigationService.getKbUrl(account.slug, kbSlug);
      }),
    ),
    { initialValue: '' },
  );

  openDeveloperIntegrations(): void {
    this.modalService.openModal(DeveloperIntegrationsModalComponent);
  }

  openTestPage(): void {
    this.modalService.openModal(TestPageModalComponent);
  }
}
