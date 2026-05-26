import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { SDKService } from '@flaps/core';
import { SisModalService } from '@nuclia/sistema';
import { ModalConfig, ModalRef } from '@guillotinaweb/pastanaga-angular';
import { TrialExpiredModalComponent } from './trial-expired-modal/trial-expired-modal.component';
import { getCoworkTrialState } from './simple.utils';

@Component({
  selector: 'app-simple-page',
  standalone: false,
  template: `
    @if (isReader()) {
      <app-reader-experience></app-reader-experience>
    } @else {
      <app-simple-kb></app-simple-kb>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimplePageComponent {
  private sdk = inject(SDKService);
  private modalService = inject(SisModalService);
  private destroyRef = inject(DestroyRef);
  private expiredModalRef?: ModalRef;

  isReader = toSignal(this.sdk.currentKb.pipe(map((kb) => !kb.admin && !kb.contrib)), { initialValue: true });

  constructor() {
    this.sdk.currentAccount
      .pipe(
        take(1),
        filter((account) => getCoworkTrialState(account).isTrialExpired),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.expiredModalRef = this.modalService.openModal(
          TrialExpiredModalComponent,
          new ModalConfig({ dismissable: false }),
        );
      });

    this.destroyRef.onDestroy(() => {
      this.expiredModalRef?.close();
    });
  }
}
