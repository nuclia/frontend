import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PaButtonModule, PaDropdownModule, PaPopupModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { SisModalService } from '@nuclia/sistema';
import { DeveloperIntegrationsModalComponent } from '../developer-integrations-modal/developer-integrations-modal.component';
import { TestPageModalComponent } from '../test-page-modal/test-page-modal.component';

/**
 * "More actions" menu (developer integrations / test page), shown identically in
 * both the onboarding header and the done-state kb-header. Defined once and self-sufficient so
 * it can be dropped anywhere without prop-drilling.
 */
@Component({
  selector: 'app-kb-more-actions',
  imports: [PaButtonModule, PaDropdownModule, PaPopupModule, TranslateModule],
  templateUrl: './kb-more-actions.component.html',
  styleUrl: './kb-more-actions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KbMoreActionsComponent {
  private modalService = inject(SisModalService);

  openDeveloperIntegrations(): void {
    this.modalService.openModal(DeveloperIntegrationsModalComponent);
  }

  openTestPage(): void {
    this.modalService.openModal(TestPageModalComponent);
  }
}
