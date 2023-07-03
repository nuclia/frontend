import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, forkJoin, from, of, Subject } from 'rxjs';
import {
  catchError,
  delay,
  distinctUntilChanged,
  filter,
  map,
  shareReplay,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';
import { injectScript, SDKService, StateService, UserService } from '@flaps/core';
import { BillingService } from '../billing.service';
import { StripeCustomer, SubscriptionError } from '../billing.models';
import { COUNTRIES, REQUIRED_VAT_COUNTRIES } from '../utils';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { AccountTypes } from '@nuclia/core';
import { NavigationService } from '@flaps/common';
import { ReviewComponent } from '../review/review.component';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutComponent implements OnDestroy, OnInit {
  customerForm = new FormGroup({
    not_company: new FormControl<boolean>(false, { nonNullable: true }),
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    company: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    vat: new FormControl<string>('', { nonNullable: true }),
    phone: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    address: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    country: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    state: new FormControl<string>('', { nonNullable: true }),
    city: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    postal_code: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });

  cardName = new FormControl<string>('', { nonNullable: true, validators: [Validators.required] });
  budget = new FormControl<string>('0', { nonNullable: true, validators: [Validators.required, Validators.min(0)] });

  errors: IErrorMessages = {
    required: 'validation.required',
    email: 'validation.email',
    vat: 'billing.invalid_vat',
  } as IErrorMessages;

  loading = false;
  countries = COUNTRIES;
  requiredVatCountries = REQUIRED_VAT_COUNTRIES;
  countryList = Object.entries(COUNTRIES)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  accountType = combineLatest([
    this.sdk.currentAccount.pipe(
      take(1),
      map((account) => account.type),
    ),
    this.route.queryParams.pipe(map((params) => params['type'])),
  ]).pipe(
    map(([currentType, nextType]) => (nextType && currentType !== nextType ? (nextType as AccountTypes) : undefined)),
    shareReplay(),
  );
  subscribeMode = this.accountType.pipe(map((type) => !!type));

  prices = this.billingService.getPrices().pipe(shareReplay());
  updateCurrency = new Subject<string>();
  currency = this.updateCurrency.pipe(
    distinctUntilChanged(),
    switchMap((country) => this.billingService.getCurrency(country)),
    shareReplay(),
  );

  editCustomer = true;
  private _customer?: StripeCustomer;
  get customer() {
    return this._customer;
  }
  set customer(customer) {
    this._customer = customer;
    if (customer) {
      this.updateCurrency.next(customer.billing_details.country);
    }
  }
  get isCompany() {
    return !this.customerForm.value.not_company;
  }
  get vatRequired() {
    return this.customerForm.controls.vat.hasValidator(Validators.required);
  }

  private _stripe: any;
  @ViewChild('card') private cardContainer?: ElementRef;
  card: any;
  cardError: string = '';
  validCard = false;
  editCard = false;
  token?: any;
  paymentMethodId?: string;

  unsubscribeAll = new Subject<void>();

  constructor(
    private billingService: BillingService,
    private cdr: ChangeDetectorRef,
    private toaster: SisToastService,
    private sdk: SDKService,
    private stateService: StateService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private navigation: NavigationService,
    private modalService: SisModalService,
    private translate: TranslateService,
  ) {
    this.initCustomer();
    this.initStripe();
    this.initBudget();
  }

  ngOnInit() {
    this.customerForm.controls.not_company.valueChanges
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((not_company) => {
        this.updateCustomerValidation({ not_company });
      });
    this.customerForm.controls.country.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe((country) => {
      this.updateCustomerValidation({ country });
    });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  initCustomer() {
    forkJoin([
      this.billingService.getCustomer(),
      this.billingService.country.pipe(take(1)),
      this.userService.userPrefs.pipe(
        filter((user) => !!user),
        take(1),
      ),
    ]).subscribe(([customer, country, user]) => {
      if (customer) {
        this.customer = customer;
        this.updateCustomerForm(customer);
        this.editCustomer = false;
        this.editCard = true;
        this.cdr?.markForCheck();
      } else {
        if (country) {
          this.customerForm.patchValue({ country });
          this.updateCurrency.next(country);
        }
        if (user?.email) {
          this.customerForm.patchValue({ email: user.email });
        }
      }
    });
  }

  initBudget() {
    this.subscribeMode
      .pipe(
        switchMap((subscribeMode) => {
          return subscribeMode
            ? this.billingService.budgetEstimation.pipe(take(1))
            : this.billingService.getAccountUsage().pipe(map((usage) => usage.budget));
        }),
      )
      .subscribe((budget) => {
        this.budget.setValue(budget.toString());
      });
  }

  updateCustomerForm(customer: StripeCustomer) {
    this.customerForm.patchValue({ ...customer.billing_details, not_company: !customer.billing_details.is_company });
  }

  updateCustomerValidation(newValues: typeof this.customerForm.value) {
    const values = { ...this.customerForm.value, ...newValues };
    this.customerForm.controls.company.setValidators(values.not_company ? [] : [Validators.required]);
    this.customerForm.controls.vat.setValidators(
      !values.not_company && this.requiredVatCountries.includes(values.country || '') ? [Validators.required] : [],
    );
    this.customerForm.controls.company.updateValueAndValidity();
    this.customerForm.controls.vat.updateValueAndValidity();
  }

  showCustomerForm() {
    this.editCustomer = true;
    this.cdr?.markForCheck();
  }

  saveCustomer() {
    if (this.customerForm.invalid) return;
    const { not_company, company, vat, ...data } = { ...this.customerForm.getRawValue() };
    const payload = { ...data, is_company: !not_company, ...(not_company ? {} : { company, vat }) };
    const observable = this.customer
      ? this.billingService.modifyCustomer(payload).pipe(switchMap(() => this.billingService.getCustomer()))
      : this.billingService.createCustomer(payload);
    observable.subscribe({
      next: (customer) => {
        if (customer) {
          this.customer = customer;
          this.customerForm.reset();
          this.updateCustomerForm(customer);
          this.editCustomer = false;
          if (!this.token) {
            this.editCard = true;
          }
          this.cdr?.markForCheck();
        }
      },
      error: (error) => {
        if (error.status === 422 && error.body?.detail?.[0]?.loc?.includes('vat')) {
          this.customerForm.controls.vat.setErrors({ vat: true });
          this.customerForm.controls.vat.markAsDirty();
          this.cdr?.markForCheck();
        } else {
          this.showError();
        }
      },
    });
  }

  initStripe() {
    this.subscribeMode
      .pipe(
        filter((value) => value),
        switchMap(() => injectScript('https://js.stripe.com/v3/')),
        take(1),
        filter((result) => !!result),
        switchMap(() => this.billingService.getStripePublicKey()),
      )
      .subscribe((key) => {
        this._stripe = (window as any)['Stripe'](key.public_key);
        this.createCardElement();
      });
  }

  createCardElement() {
    const elements = this._stripe.elements();
    this.card = elements.create('card', { hidePostalCode: true });
    this.card.mount(this.cardContainer!.nativeElement);
    this.card.on('change', (event: any) => {
      this.validCard = !event.error && event.complete;
      this.cardError = event.error ? event.error.message : '';
      this.cdr.markForCheck();
    });
  }

  createPaymentMethod() {
    this.loading = true;
    from(
      this._stripe.createToken(this.card, {
        name: this.cardName.value,
        address_country: this.customer?.billing_details.country,
        address_zip: this.customer?.billing_details.postal_code,
      }),
    )
      .pipe(
        tap((data: any) => {
          if (data.error) {
            throw new Error(data.error.message);
          }
        }),
        switchMap((data: any) =>
          this.billingService.createPaymentMethod({ token: data.token.id }).pipe(
            catchError(() => {
              throw new Error('billing.invalid_card');
            }),
            map((result) => ({ result, token: data.token })),
          ),
        ),
      )
      .subscribe({
        next: ({ result, token }) => {
          this.token = token;
          this.paymentMethodId = result.payment_method_id;
          this.editCard = false;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.loading = false;
          this.showError(error.message);
          this.cdr.markForCheck();
        },
      });
  }

  showCardForm() {
    this.editCard = true;
    this.cdr?.markForCheck();
  }

  doSubscribe() {
    this.openReview()
      .pipe(
        take(1),
        filter((result) => !!result),
        tap(() => {
          this.loading = true;
          this.cdr?.markForCheck();
        }),
        switchMap(() =>
          this.accountType.pipe(
            take(1),
            filter((accountType) => !!accountType),
            map((accountType) => accountType as AccountTypes),
          ),
        ),
        switchMap((accountType) =>
          this.billingService
            .createSubscription({
              payment_method_id: this.paymentMethodId || '',
              on_demand_budget: parseInt(this.budget.value),
              account_type: accountType,
            })
            .pipe(
              catchError((error) => {
                if (error.body?.error_code === SubscriptionError.PAYMENT_METHOD_NOT_ATTACHED) {
                  this.editCard = true;
                  this.token = undefined;
                  this.paymentMethodId = undefined;
                  throw new Error('billing.invalid_card');
                } else if (error.body?.error_code === SubscriptionError.INVALID_ADDRESS) {
                  this.editCustomer = true;
                  throw new Error('billing.invalid_address');
                }
                throw new Error();
              }),
            ),
        ),
        switchMap((subscription) => {
          if (subscription.status === 'active') {
            // Success
            return of(true);
          } else if (subscription.status === 'incomplete' && subscription.requires_action && !subscription.error) {
            // 3D secure required
            return from(
              this._stripe.confirmCardPayment(subscription.client_secret, {
                payment_method: subscription.payment_method_id,
              }),
            ).pipe(
              tap((result: any) => {
                if (result.error) {
                  // 3D secure failed
                  throw new Error(result.error.message);
                }
              }),
            );
          } else {
            // Other errors
            throw new Error();
          }
        }),
        switchMap(() =>
          this.sdk.currentAccount.pipe(
            take(1),
            delay(2000), // Need to wait for the updated account data to be available
          ),
        ),
        switchMap((account) => this.sdk.nuclia.db.getAccount(account.slug)),
        tap((newAccount) => this.stateService.setAccount(newAccount)),
      )
      .subscribe({
        next: (newAccount) => {
          this.toaster.success('billing.success');
          this.router.navigateByUrl(`${this.navigation.getAccountUrl(newAccount.slug)}/manage/home`);
        },
        error: (error) => {
          this.loading = false;
          this.cdr?.markForCheck();
          this.showError(error.message);
        },
      });
  }

  showError(message?: string) {
    this.toaster.error(
      message
        ? this.translate.instant(message)
        : this.translate.instant('generic.error.oops') +
            '<br>' +
            this.translate.instant('billing.assistance', { url: 'mailto:support@nuclia.com' }),
    );
  }

  openReview() {
    return forkJoin([
      this.prices.pipe(take(1)),
      this.currency.pipe(take(1)),
      this.accountType.pipe(
        take(1),
        filter((accountType) => !!accountType),
        map((accountType) => accountType as AccountTypes),
      ),
    ]).pipe(
      switchMap(
        ([prices, currency, accountType]) =>
          this.modalService.openModal(ReviewComponent, {
            dismissable: true,
            data: {
              account: accountType,
              customer: this.customer,
              token: this.token,
              prices: prices[accountType],
              budget: this.budget.value,
              currency,
            },
          }).onClose,
      ),
    );
  }

  saveBudget() {
    this.billingService
      .modifySubscription({ on_demand_budget: parseInt(this.budget.value) })
      .pipe(switchMap(() => this.billingService.getAccountUsage()))
      .subscribe((usage) => {
        this.budget.setValue(usage.budget.toString());
        this.budget.markAsPristine();
        if (usage.budget < Object.values(usage.invoice_items).reduce((acc, curr) => acc + curr.over_cost, 0)) {
          this.toaster.warning('billing.budget_warning');
        }
        this.cdr?.markForCheck();
      });
  }
}
