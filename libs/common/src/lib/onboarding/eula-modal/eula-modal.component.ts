import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SDKService } from '@flaps/core';
import { ModalRef, PaButtonModule, PaModalModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { switchMap, take } from 'rxjs';

import { TranslatePipe } from '@ngx-translate/core';

@Component({
  imports: [PaModalModule, PaButtonModule, PaTogglesModule, TranslatePipe],
  templateUrl: './eula-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EulaModalComponent {
  accepted = signal(false);

  constructor(
    public modal: ModalRef,
    private sdk: SDKService,
  ) {}

  accept() {
    this.sdk.currentAccount
      .pipe(
        take(1),
        switchMap((account) =>
          this.sdk.nuclia.db
            .modifyAccount(account.slug, { eula_accepted: true })
            .pipe(switchMap(() => this.sdk.nuclia.db.getAccount(account.slug))),
        ),
      )
      .subscribe((account) => {
        this.sdk.account = account;
        this.modal.close();
      });
  }
}
