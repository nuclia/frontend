import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, filter, map, Observable, of, switchMap, take } from 'rxjs';
import { BillingService, FeaturesService, NavigationService, SDKService } from '@flaps/core';
import { Account } from '@nuclia/core';
import { SisModalService } from '@nuclia/sistema';
import { ModalConfig, ModalRef } from '@guillotinaweb/pastanaga-angular';
import { TrialExpiredModalComponent } from './trial-expired-modal/trial-expired-modal.component';
import { isTrialExpired } from './context-box.utils';
import { ReaderExperienceComponent } from './reader-experience/reader-experience.component';
import { ContextBoxComponent } from './context-box/context-box.component';

@Component({
  selector: 'app-context-box-page',
  template: `
    @if (isReader()) {
      <app-reader-experience></app-reader-experience>
    } @else {
      <app-context-box></app-context-box>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReaderExperienceComponent, ContextBoxComponent],
})
export class ContextBoxPageComponent {
  private sdk = inject(SDKService);
  private features = inject(FeaturesService);
  private billing = inject(BillingService);
  private navigation = inject(NavigationService);
  private modalService = inject(SisModalService);
  private destroyRef = inject(DestroyRef);
  private expiredModalRef?: ModalRef;

  isReader = toSignal(this.sdk.currentKb.pipe(map((kb) => !kb.admin && !kb.contrib)), { initialValue: true });

  constructor() {
    combineLatest([this.sdk.currentAccount, this.features.unstable.contextBoxNoTrial])
      .pipe(
        take(1),
        switchMap(([account, noTrial]) =>
          this.getBlockingAction(account, noTrial).pipe(map((action) => ({ account, action }))),
        ),
        filter(({ action }) => !!action),
        takeUntilDestroyed(),
      )
      .subscribe(({ account, action }) => {
        if (action === 'pay') {
          this.navigation.navigateExternal(this.navigation.getUpgradeUrl(account.slug), { withFromApp: true });
        } else {
          this.expiredModalRef = this.modalService.openModal(
            TrialExpiredModalComponent,
            new ModalConfig({ dismissable: false }),
          );
        }
      });

    this.destroyRef.onDestroy(() => {
      this.expiredModalRef?.close();
    });
  }

  private getBlockingAction(account: Account, noTrial: boolean): Observable<'pay' | 'modal' | null> {
    if (!noTrial || !account.can_manage_account) {
      return of(isTrialExpired(account) ? 'modal' : null);
    }
    if (account.type !== 'cowork') {
      return of(null);
    }
    return this.billing.hasSubscription().pipe(
      map((hasSubscription) => (hasSubscription ? null : 'pay')),
      catchError(() => of(null)),
    );
  }
}
