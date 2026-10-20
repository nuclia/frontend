import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BudgetComponent } from '@flaps/common';
import { AccountBudget, BillingService, NavigationService, SDKService } from '@flaps/core';
import { PaButtonModule, PaIconModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { AccountTypes } from '@nuclia/core';
import { BackButtonComponent, COUNTRIES, SisToastService, SpinnerComponent } from '@nuclia/sistema';
import { combineLatest, forkJoin, of } from 'rxjs';
import { filter, map, shareReplay, take } from 'rxjs/operators';
import { CheckoutFormComponent } from '../checkout-form/checkout-form.component';
import { CheckoutStrategy } from './checkout.model';
import { CheckoutService } from './checkout.service';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CheckoutService],
  imports: [
    BackButtonComponent,
    PaIconModule,
    PaButtonModule,
    RouterLink,
    ReactiveFormsModule,
    PaTogglesModule,
    CheckoutFormComponent,
    BudgetComponent,
    SpinnerComponent,
    AsyncPipe,
    CurrencyPipe,
    TranslatePipe,
  ],
})
export class CheckoutComponent {
  private billingService = inject(BillingService);
  private cdr = inject(ChangeDetectorRef);
  private toaster = inject(SisToastService);
  private sdk = inject(SDKService);
  private route = inject(ActivatedRoute);
  private navigation = inject(NavigationService);

  protected checkoutService = inject(CheckoutService);
  budget?: Partial<AccountBudget>;
  countries = COUNTRIES;

  accountType = combineLatest([
    this.sdk.currentAccount.pipe(
      take(1),
      map((account) => account.type),
    ),
    this.route.queryParams.pipe(map((params) => params['type'])),
  ]).pipe(
    map(([currentType, nextType]) => (nextType && currentType !== nextType ? (nextType as AccountTypes) : undefined)),
    shareReplay(1),
  );
  subscribeMode = this.accountType.pipe(map((type) => !!type));
  isCowork = combineLatest([
    this.sdk.currentAccount.pipe(
      take(1),
      map((account) => account.type === 'cowork'),
    ),
    this.route.queryParams.pipe(map((params) => params['type'] === 'cowork')),
  ]).pipe(
    map(([currentIsCowork, nextIsCowork]) => currentIsCowork || nextIsCowork),
    shareReplay(1),
  );
  contextBoxMode = this.navigation.contextBoxMode;
  backToSettingsLink = this.sdk.currentAccount.pipe(
    map((account) => `${this.navigation.getAccountManageUrl(account.slug)}/billing`),
  );
  monthly = combineLatest([
    this.checkoutService.prices$,
    this.accountType.pipe(
      filter((accountType) => !!accountType),
      map((accountType) => accountType as AccountTypes),
    ),
  ]).pipe(map(([prices, accountType]) => !!prices[accountType]?.recurring?.month));

  isSubscribedToStripe = this.billingService.isSubscribedToStripe;
  billingDetailsEnabled = true;
  editCustomer = true;
  editCard = false;

  private strategy: CheckoutStrategy = {
    details: () =>
      forkJoin([
        this.checkoutService.prices$.pipe(take(1)),
        this.checkoutService.currency$.pipe(take(1)),
        this.accountType.pipe(
          take(1),
          filter((accountType) => !!accountType),
          map((accountType) => accountType as AccountTypes),
        ),
      ]).pipe(
        map(([prices, currency, account]) => ({
          account,
          prices: prices[account],
          currency,
          budget: this.budget?.on_demand_budget || null,
        })),
      ),
    redirectUrl: (account) => {
      this.sdk.account = account;
      return of(`${this.navigation.getAccountManageUrl(account.slug)}/billing`);
    },
    onError: (message) => {
      if (message === 'billing.invalid_card') {
        this.editCard = true;
      } else if (message === 'billing.invalid_address') {
        this.editCustomer = true;
      }
      this.cdr.markForCheck();
    },
  };

  constructor() {
    this.initCustomer();
  }

  private initCustomer() {
    forkJoin([this.subscribeMode.pipe(take(1)), this.checkoutService.loadCustomer()]).subscribe(
      ([subscribeMode, customer]) => {
        if (customer) {
          this.editCustomer = false;
          this.editCard = true;
        } else if (!subscribeMode) {
          // Accounts subscribed through payment links do not have billing details
          this.billingDetailsEnabled = false;
        }
        this.cdr.markForCheck();
      },
    );
  }

  showCustomerForm() {
    this.editCustomer = true;
    this.cdr.markForCheck();
  }

  saveCustomer() {
    if (this.checkoutService.customerForm.invalid) return;
    this.checkoutService.saveCustomer().subscribe({
      next: () => {
        this.editCustomer = false;
        if (!this.checkoutService.token()) {
          this.editCard = true;
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.checkoutService.handleError(error);
        this.cdr.markForCheck();
      },
    });
  }

  createPaymentMethod() {
    this.checkoutService.loading.set(true);
    this.checkoutService.createPaymentMethod().subscribe({
      next: () => {
        this.editCard = false;
        this.checkoutService.loading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => this.checkoutService.handleError(error),
    });
  }

  showCardForm() {
    this.editCard = true;
    this.cdr.markForCheck();
  }

  doSubscribe() {
    this.checkoutService.subscribe(this.strategy);
  }

  updatePaymentMethod() {
    const isProd = location.hostname === 'rag.progress.cloud';
    window.open(
      isProd
        ? 'https://billing.stripe.com/p/login/28EaEY6Icfkf6Uuek46c000'
        : 'https://billing.stripe.com/p/login/test_8x2fZhbiE9Xz58c95U6sw00',
      'blank',
      'noreferrer',
    );
  }

  modifyBudget() {
    if (!this.budget) {
      return;
    }
    this.billingService.saveBudget(this.budget).subscribe({
      next: ({ budgetBelowTotal }) => {
        if (budgetBelowTotal) {
          this.toaster.warning('billing.budget-warning');
        } else {
          this.toaster.success('billing.budget-modified');
        }
      },
      error: () => {
        this.toaster.error('generic.error.oops');
      },
    });
  }
}
