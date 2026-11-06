import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { SDKService } from '@flaps/core';
import { ModalRef, PaButtonModule, PaModalModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { switchMap } from 'rxjs';

import { TranslatePipe } from '@ngx-translate/core';

@Component({
  imports: [PaModalModule, PaButtonModule, PaTogglesModule, TranslatePipe],
  templateUrl: './eula-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EulaModalComponent {
  protected modal = inject(ModalRef<{ accountSlug: string }>);
  private sdk = inject(SDKService);

  accountSlug = this.modal.config.data?.['accountSlug'] || '';
  accepted = signal(false);

  accept() {
    this.sdk.nuclia.db
      .modifyAccount(this.accountSlug, { eula_accepted: true })
      .pipe(switchMap(() => this.sdk.nuclia.db.getAccount(this.accountSlug)))
      .subscribe((account) => {
        this.sdk.account = account;
        this.modal.close();
      });
  }
}
