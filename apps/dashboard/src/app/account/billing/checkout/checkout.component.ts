import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, from, of, Subject } from 'rxjs';
import { catchError, delay, filter, distinctUntilChanged, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';
import { injectScript, SDKService, StateService, UserService } from '@flaps/core';
import { BillingService } from '../billing.service';
import { StripeCustomer } from '../billing.models';
import { COUNTRIES } from '../utils';
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
export class CheckoutComponent implements OnInit {
  billing = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    company: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    vat: new FormControl<string>('', { nonNullable: true }),
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
  };

  subscribing = false;
  countries = COUNTRIES;
  countryList = Object.entries(COUNTRIES)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  accountType: AccountTypes = 'stash-developer';
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

  private _stripe: any;
  @ViewChild('card') private cardContainer?: ElementRef;
  card: any;
  cardError: string = '';
  validCard = false;
  editCard = false;
  token?: any;

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
    this.initForms();
    this.initStripe();
  }

  ngOnInit() {
    this.route.queryParams.pipe(take(1)).subscribe((params) => {
      if (params['type']) {
        this.accountType = params['type'];
      }
    });
  }

  initForms() {
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
        this.billing.patchValue(customer.billing_details);
        this.editCustomer = false;
        this.editCard = true;
        this.cdr?.markForCheck();
      } else {
        if (country) {
          this.billing.patchValue({ country });
          this.updateCurrency.next(country);
        }
        if (user?.email) {
          this.billing.patchValue({ email: user.email });
        }
      }
    });
    this.billingService.budgetEstimation.pipe(take(1)).subscribe((budget) => {
      this.budget.setValue(budget.toString());
    });
  }

  showCustomerForm() {
    this.editCustomer = true;
    this.cdr?.markForCheck();
  }

  saveCustomer() {
    if (this.billing.invalid) return;
    const observable = this.customer
      ? this.billingService
          .modifyCustomer(this.billing.getRawValue())
          .pipe(switchMap(() => this.billingService.getCustomer()))
      : this.billingService.createCustomer(this.billing.getRawValue());
    observable.subscribe((customer) => {
      if (customer) {
        this.customer = customer;
        this.billing.reset();
        this.billing.patchValue(customer.billing_details);
        this.editCustomer = false;
        if (!this.token) {
          this.editCard = true;
        }
        this.cdr?.markForCheck();
      }
    });
  }

  initStripe() {
    injectScript('https://js.stripe.com/v3/')
      .pipe(
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

  getToken() {
    from(
      this._stripe.createToken(this.card, {
        name: this.cardName.value,
        address_country: this.customer?.billing_details.country,
        address_zip: this.customer?.billing_details.postal_code,
      }),
    ).subscribe((data: any) => {
      if (data.error) {
        this.toaster.error(data.error.message);
      } else if (data.token) {
        this.token = data.token;
        this.editCard = false;
        this.cdr.markForCheck();
      }
    });
  }

  showCardForm() {
    this.editCard = true;
    this.cdr?.markForCheck();
  }

  subscribe() {
    this.openReview()
      .pipe(
        take(1),
        filter((result) => !!result),
        tap(() => {
          this.subscribing = true;
          this.cdr?.markForCheck();
        }),
        switchMap(() =>
          this.billingService
            .createSubscription({
              payment_method_id: this.token.id,
              on_demand_budget: parseInt(this.budget.value),
              account_type: this.accountType!,
            })
            .pipe(
              catchError((error) => {
                if (error.status === 400) {
                  // Error with the card
                  throw new Error('billing.card_error');
                }
                throw error;
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
            // Other card errors
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
          this.subscribing = false;
          this.cdr?.markForCheck();
          this.toaster.error(
            (error?.message || this.translate.instant('generic.error.oops')) +
              '<br>' +
              this.translate.instant('billing.assistance', { url: 'mailto:billing@nuclia.com' }),
          );
        },
      });
  }

  openReview() {
    return forkJoin([this.prices.pipe(take(1)), this.currency.pipe(take(1))]).pipe(
      switchMap(
        ([prices, currency]) =>
          this.modalService.openModal(ReviewComponent, {
            dismissable: true,
            data: {
              account: this.accountType,
              customer: this.customer,
              token: this.token,
              prices: prices[this.accountType],
              budget: this.budget.value,
              currency,
            },
          }).onClose,
      ),
    );
  }
}
