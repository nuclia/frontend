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
import { combineLatest, forkJoin, from, merge, of, Subject } from 'rxjs';
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
import {
  AccountBudget,
  BillingService,
  injectScript,
  NavigationService,
  RecurrentPriceInterval,
  SDKService,
  StripeCustomer,
  SubscriptionError,
  UserService,
} from '@flaps/core';
import { COUNTRIES } from '../utils';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { AccountTypes } from '@nuclia/core';
import { ReviewComponent } from '../review/review.component';
import { SubscriptionService } from '../subscription.service';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class CheckoutComponent implements OnDestroy, OnInit {
  customerForm = new FormGroup({
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

  cardName = new FormControl<string>('', { nonNullable: true, validators: [Validators.required] });
  budget?: Partial<AccountBudget>;

  errors: IErrorMessages = {
    required: 'validation.required',
    email: 'validation.email',
    vat: 'billing.invalid_vat',
  } as IErrorMessages;

  loading = false;
  countries = COUNTRIES;
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
  usage = this.billingService.getAccountUsage().pipe(shareReplay(1));

  prices$ = this.billingService.getPrices().pipe(shareReplay());
  monthly = combineLatest([
    this.prices$,
    this.accountType.pipe(
      filter((accountType) => !!accountType),
      map((accountType) => accountType as AccountTypes),
    ),
  ]).pipe(map(([prices, accountType]) => !!prices[accountType]?.recurring?.month));
  updateCurrency = new Subject<string>();
  currency$ = merge(
    this.subscription.initialCurrency,
    this.updateCurrency.pipe(
      distinctUntilChanged(),
      switchMap((country) => this.billingService.getCurrency(country)),
    ),
  ).pipe(shareReplay(1));

  billingDetailsEnabled = true;
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
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private navigation: NavigationService,
    private modalService: SisModalService,
    private translate: TranslateService,
    private subscription: SubscriptionService,
  ) {
    this.initCustomer();
    this.initStripe();
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
      this.subscribeMode.pipe(take(1)),
      this.billingService.getCustomer(),
      this.userService.userPrefs.pipe(
        filter((user) => !!user),
        take(1),
      ),
    ]).subscribe(([subscribeMode, customer, user]) => {
      if (customer) {
        this.customer = customer;
        this.updateCustomerForm(customer);
        this.editCustomer = false;
        this.editCard = true;
      } else if (subscribeMode && !customer) {
        if (user?.email) {
          this.customerForm.patchValue({ email: user.email });
        }
      } else if (!subscribeMode && !customer) {
        // Accounts subscribed through payment links do not have billing details
        this.billingDetailsEnabled = false;
      }
      this.cdr?.markForCheck();
    });
  }

  updateCustomerForm(customer: StripeCustomer) {
    this.customerForm.patchValue({ ...customer.billing_details, not_company: !customer.billing_details.is_company });
  }

  updateCustomerValidation(newValues: typeof this.customerForm.value) {
    const values = { ...this.customerForm.value, ...newValues };
    this.customerForm.controls.company.setValidators(values.not_company ? [] : [Validators.required]);
    this.customerForm.controls.vat.setValidators(values.not_company ? [] : [Validators.required]);
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
          forkJoin([
            this.accountType.pipe(
              take(1),
              filter((accountType) => !!accountType),
              map((accountType) => accountType as AccountTypes),
              take(1),
            ),
            this.monthly.pipe(take(1)),
          ]),
        ),
        switchMap(([accountType, monthly]) =>
          this.billingService
            .createSubscription({
              payment_method_id: this.paymentMethodId || '',
              on_demand_budget: this.budget?.on_demand_budget || null,
              account_type: accountType,
              billing_interval: monthly ? RecurrentPriceInterval.MONTH : RecurrentPriceInterval.YEAR,
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
        tap((newAccount) => (this.sdk.account = newAccount)),
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
            this.translate.instant('billing.assistance', { url: 'mailto:sales@nuclia.com' }),
    );
  }

  openReview() {
    return forkJoin([
      this.prices$.pipe(take(1)),
      this.currency$.pipe(take(1)),
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
              budget: this.budget?.on_demand_budget || null,
              currency,
            },
          }).onClose,
      ),
    );
  }

  updatePaymentMethod() {
    const isProd = location.hostname === 'nuclia.cloud';
    window.open(
      isProd
        ? 'https://billing.stripe.com/p/login/3csdRbcYAb0y07u000'
        : 'https://billing.stripe.com/p/login/test_aEU4k8frDb9w2ModQQ',
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
