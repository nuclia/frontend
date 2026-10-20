import { DestroyRef, ElementRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  BillingService,
  Currency,
  injectScript,
  NavigationService,
  Prices,
  RecurrentPriceInterval,
  SDKService,
  StripeCustomer,
  StripeSubscription,
  StripeSubscriptionCreation,
  SubscriptionError,
  UserService,
} from '@flaps/core';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';
import { TranslateService } from '@ngx-translate/core';
import { Account, AccountTypes } from '@nuclia/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import {
  catchError,
  delay,
  distinctUntilChanged,
  filter,
  forkJoin,
  from,
  map,
  merge,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  take,
  tap,
  throwError,
} from 'rxjs';
import { ReviewComponent } from '../review/review.component';
import { SubscriptionService } from '../subscription.service';

export function createCustomerForm() {
  return new FormGroup({
    not_company: new FormControl<boolean>(false, { nonNullable: true }),
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    company: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    vat: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    phone: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    address: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    country: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    state: new FormControl<string>('', { nonNullable: true }),
    city: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    postal_code: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });
}

export const CUSTOMER_FORM_ERRORS = {
  required: 'validation.required',
  email: 'validation.email',
  vat: 'billing.invalid_vat',
} as IErrorMessages;

type CustomerForm = ReturnType<typeof createCustomerForm>;

/** Errors whose message is meant for the user: an i18n key or a message coming from Stripe. */
export class CheckoutError extends Error {}

export interface CheckoutPlanDetails {
  account: AccountTypes;
  prices: Prices;
  currency: Currency;
  budget: number | null;
  contextBox?: boolean;
}

export interface CheckoutStrategy {
  details(customer: StripeCustomer): Observable<CheckoutPlanDetails>;
  redirectUrl(account: Account): Observable<string>;
  onError?(message?: string): void;
}

/**
 * State and steps of the Stripe checkout (billing details, card, review, subscription).
 * Provide it in the component using it: every checkout page gets its own instance.
 */
@Injectable()
export class CheckoutService {
  private billing = inject(BillingService);
  private sdk = inject(SDKService);
  private userService = inject(UserService);
  private modalService = inject(SisModalService);
  private navigation = inject(NavigationService);
  private toaster = inject(SisToastService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  private stripe: any;
  private card: any;
  private paymentMethodId?: string;
  private tokenKey?: string;
  private updateCurrency = new Subject<string>();

  readonly customerForm = createCustomerForm();
  readonly cardName = new FormControl<string>('', { nonNullable: true, validators: [Validators.required] });
  readonly customer = signal<StripeCustomer | undefined>(undefined);
  readonly token = signal<any>(undefined);
  readonly validCard = signal(false);
  readonly cardError = signal('');
  readonly loading = signal(false);

  readonly currency$ = merge(
    inject(SubscriptionService).initialCurrency.pipe(take(1)),
    this.updateCurrency.pipe(
      distinctUntilChanged(),
      switchMap((country) => this.billing.getCurrency(country)),
    ),
  ).pipe(shareReplay(1));
  readonly prices$ = this.currency$.pipe(
    switchMap((currency) => this.billing.getPrices(currency)),
    shareReplay(1),
  );

  get isCompany() {
    return !this.customerForm.value.not_company;
  }

  constructor() {
    const form = this.customerForm;
    form.controls.not_company.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((not_company) => this.updateValidation({ not_company }));
    form.controls.country.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((country) => this.updateValidation({ country }));
  }

  loadCustomer(): Observable<StripeCustomer | undefined> {
    return forkJoin([
      this.billing.getCustomer(),
      this.userService.userPrefs.pipe(
        filter((user) => !!user),
        take(1),
      ),
    ]).pipe(
      map(([customer, user]) => {
        if (customer) {
          this.setCustomer(customer);
        } else if (user?.email) {
          this.customerForm.patchValue({ email: user.email });
        }
        return customer || undefined;
      }),
      takeUntilDestroyed(this.destroyRef),
    );
  }

  initStripe(container: () => ElementRef<HTMLElement> | undefined) {
    injectScript('https://js.stripe.com/v3/')
      .pipe(
        take(1),
        filter((loaded) => !!loaded),
        switchMap(() => this.billing.getStripePublicKey()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((key) => {
        this.stripe = (window as any)['Stripe'](key.public_key);
        this.card = this.stripe.elements().create('card', { hidePostalCode: true });
        this.card.mount(container()!.nativeElement);
        this.card.on('change', (event: any) => {
          this.token.set(undefined);
          this.paymentMethodId = undefined;
          this.validCard.set(!event.error && event.complete);
          this.cardError.set(event.error ? event.error.message : '');
        });
      });
  }

  saveCustomer(): Observable<StripeCustomer> {
    const { not_company, company, vat, ...data } = this.customerForm.getRawValue();
    const payload = { ...data, is_company: !not_company, ...(not_company ? {} : { company, vat }) };
    const saved = this.customer()
      ? this.billing.modifyCustomer(payload).pipe(switchMap(() => this.billing.getCustomer()))
      : this.billing.createCustomer(payload);
    return saved.pipe(
      map((customer) => {
        if (!customer) {
          throw new CheckoutError('billing.unknown_error');
        }
        this.customerForm.reset();
        this.setCustomer(customer);
        return customer;
      }),
    );
  }

  createPaymentMethod(): Observable<void> {
    const customer = this.customer();
    return from(
      this.stripe.createToken(this.card, {
        name: this.cardName.value,
        address_country: customer?.billing_details.country,
        address_zip: customer?.billing_details.postal_code,
      }),
    ).pipe(
      tap((data: any) => {
        if (data.error) {
          throw new CheckoutError(data.error.message);
        }
      }),
      switchMap((data: any) =>
        this.billing.createPaymentMethod({ token: data.token.id }).pipe(
          catchError(() => {
            throw new CheckoutError('billing.invalid_card');
          }),
          map((result) => {
            this.token.set(data.token);
            this.tokenKey = this.paymentKey();
            this.paymentMethodId = result.payment_method_id;
          }),
        ),
      ),
    );
  }

  submit(strategy: CheckoutStrategy) {
    if (this.loading()) return;
    if (this.customerForm.invalid || this.cardName.invalid || !this.validCard()) {
      this.customerForm.markAllAsTouched();
      this.cardName.markAsTouched();
      return;
    }
    this.loading.set(true);
    this.saveCustomer()
      .pipe(
        switchMap(() => (this.hasValidToken() ? of(undefined) : this.createPaymentMethod())),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.subscribe(strategy),
        error: (error) => this.handleError(error),
      });
  }

  subscribe(strategy: CheckoutStrategy) {
    const customer = this.customer();
    if (!customer) {
      this.handleError(new CheckoutError('billing.unknown_error'), strategy);
      return;
    }
    strategy
      .details(customer)
      .pipe(
        switchMap((details) => this.openReview(customer, details).pipe(map((confirmed) => ({ confirmed, details })))),
        take(1),
        tap(({ confirmed }) => this.loading.set(confirmed)),
        filter(({ confirmed }) => confirmed),
        switchMap(({ details }) =>
          this.activate({
            payment_method_id: this.paymentMethodId || '',
            on_demand_budget: details.budget,
            account_type: details.account,
            billing_interval: details.prices.recurring?.month
              ? RecurrentPriceInterval.MONTH
              : RecurrentPriceInterval.YEAR,
          }),
        ),
        switchMap((account) => strategy.redirectUrl(account)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (url) => {
          this.toaster.success('billing.success');
          this.navigation.navigateExternal(url);
        },
        error: (error) => this.handleError(error, strategy),
      });
  }

  handleError(
    error: { status?: number; body?: { detail?: { loc?: string[] }[] }; message?: string },
    strategy?: CheckoutStrategy,
  ) {
    this.loading.set(false);
    if (error.message === 'billing.invalid_card') {
      this.token.set(undefined);
      this.paymentMethodId = undefined;
    }
    if (!this.applyVatError(error)) {
      this.showError(error instanceof CheckoutError ? error.message : undefined);
    }
    strategy?.onError?.(error.message);
  }

  private paymentKey() {
    const { postal_code, country } = this.customer()?.billing_details || {};
    return [this.cardName.value, postal_code, country].join('|');
  }

  private hasValidToken() {
    return !!this.token() && this.tokenKey === this.paymentKey();
  }

  private setCustomer(customer: StripeCustomer) {
    this.customer.set(customer);
    this.customerForm.patchValue({ ...customer.billing_details, not_company: !customer.billing_details.is_company });
    this.updateCurrency.next(customer.billing_details.country);
  }

  private updateValidation(newValues: Partial<CustomerForm['value']>) {
    const { company, vat } = this.customerForm.controls;
    const required = { ...this.customerForm.value, ...newValues }.not_company ? [] : [Validators.required];
    company.setValidators(required);
    vat.setValidators(required);
    company.updateValueAndValidity();
    vat.updateValueAndValidity();
  }

  private applyVatError(error: { status?: number; body?: { detail?: { loc?: string[] }[] } }): boolean {
    if (error.status !== 422 || !error.body?.detail?.[0]?.loc?.includes('vat')) {
      return false;
    }
    const vat = this.customerForm.controls.vat;
    vat.setErrors({ vat: true });
    vat.markAsDirty();
    vat.markAsTouched();
    return true;
  }

  private openReview(customer: StripeCustomer, details: CheckoutPlanDetails): Observable<boolean> {
    const { account, prices, currency, budget, contextBox } = details;
    const modal = this.modalService.openModal(ReviewComponent, {
      dismissable: true,
      data: { account, contextBox, customer, token: this.token(), prices, budget, currency },
    });
    return merge(modal.onClose, modal.onDismiss.pipe(map(() => false)));
  }

  private activate(request: StripeSubscriptionCreation): Observable<Account> {
    return this.billing.createSubscription(request).pipe(
      catchError((error) => throwError(() => new CheckoutError(this.subscriptionErrorKey(error)))),
      switchMap((subscription) => this.confirmSubscription(subscription)),
      switchMap(() => this.sdk.currentAccount.pipe(take(1))),
      delay(2000), // Need to wait for the updated account data to be available
      switchMap((account) => this.sdk.nuclia.db.getAccount(account.slug)),
    );
  }

  private confirmSubscription(subscription: StripeSubscription): Observable<unknown> {
    if (subscription.status === 'active') {
      return of(true);
    } else if (subscription.status === 'incomplete' && subscription.requires_action && !subscription.error) {
      return from(
        this.stripe.confirmCardPayment(subscription.client_secret, { payment_method: subscription.payment_method_id }),
      ).pipe(
        tap((result: any) => {
          if (result.error) {
            throw new CheckoutError(result.error.message);
          }
        }),
      );
    }
    throw new CheckoutError();
  }

  private subscriptionErrorKey(error: { body?: { error_code?: string } }): string {
    switch (error.body?.error_code) {
      case SubscriptionError.PAYMENT_METHOD_NOT_ATTACHED:
        return 'billing.invalid_card';
      case SubscriptionError.INVALID_ADDRESS:
        return 'billing.invalid_address';
      default:
        return 'billing.unknown_error';
    }
  }

  private showError(message?: string) {
    this.toaster.error(
      message
        ? this.translate.instant(message)
        : this.translate.instant('generic.error.oops') +
            '<br>' +
            this.translate.instant('billing.assistance', { url: 'mailto:Sales.AgenticRAG@progress.com' }),
    );
  }
}
