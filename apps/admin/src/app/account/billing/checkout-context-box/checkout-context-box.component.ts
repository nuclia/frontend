import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AccountEntryContextService, BillingService, NavigationService, SDKService } from '@flaps/core';
import { PaButtonModule, PaIconModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { InfoCardComponent, SisModalService, SpinnerComponent } from '@nuclia/sistema';
import { filter, map, of, switchMap, take } from 'rxjs';
import { CheckoutFormComponent } from '../checkout-form/checkout-form.component';
import { CheckoutError, CheckoutService, CheckoutStrategy } from '../checkout/checkout.service';

@Component({
  selector: 'app-checkout-context-box',
  templateUrl: './checkout-context-box.component.html',
  styleUrl: './checkout-context-box.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CheckoutService],
  imports: [
    AsyncPipe,
    CurrencyPipe,
    PaButtonModule,
    PaIconModule,
    PaTogglesModule,
    CheckoutFormComponent,
    InfoCardComponent,
    SpinnerComponent,
    TranslatePipe,
  ],
})
export class CheckoutContextBoxComponent {
  private billing = inject(BillingService);
  private sdk = inject(SDKService);
  private navigation = inject(NavigationService);
  private entryContext = inject(AccountEntryContextService);
  private modalService = inject(SisModalService);
  private destroyRef = inject(DestroyRef);

  protected checkoutService = inject(CheckoutService);
  isPaymentRequired = toSignal(this.billing.isContextBoxPaymentRequired);

  private strategy: CheckoutStrategy = {
    details: (customer) =>
      // Prices are re-fetched for the saved billing country, which may differ from the currency detected on page load
      this.billing.getCurrency(customer.billing_details.country).pipe(
        switchMap((currency) => this.billing.getPrices(currency).pipe(map((prices) => ({ prices, currency })))),
        map(({ prices, currency }) => {
          if (!prices.cowork?.recurring?.month) {
            throw new CheckoutError('billing.unknown_error');
          }
          return { account: 'cowork' as const, contextBox: true, prices: prices.cowork, currency, budget: null };
        }),
      ),
    // The SDK account is not updated: it would turn the page into the plan table before the redirect
    redirectUrl: () => of(this.entryContext.getReturnUrl()),
  };

  constructor() {
    this.checkoutService.loadCustomer().subscribe();
  }

  review() {
    this.checkoutService.submit(this.strategy);
  }

  cancel() {
    if (this.checkoutService.loading()) return;
    if (this.isPaymentRequired() === false) {
      this.navigation.navigateExternal(this.entryContext.getReturnUrl());
      return;
    }
    this.modalService
      .openConfirm({
        title: 'billing.context-box.cancel-title',
        description: 'billing.context-box.cancel-description',
        confirmLabel: 'user.logout',
        cancelLabel: 'billing.context-box.cancel-stay',
      })
      .onClose.pipe(
        filter((confirmed) => !!confirmed),
        take(1),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.sdk.nuclia.auth.logout());
  }
}
